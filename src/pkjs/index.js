// Runs on the connected phone via PebbleKit JS.
// FireWatch snrkl (Phase 1): weather and units come from the Pebble mobile app's built-in
// sources instead of upstream's four weather providers and Clay settings page.
//   weather/location   instances[0] (the user's first weather location, which may be "current")
//   preferences/units  temperature unit (°C/°F)
// 12/24h is read on the watch (clock_is_24h_style), so it is not sent from here.
//
// Message keys (unchanged from upstream; main.c defines the same numbers):
//   0 REQUEST_WEATHER (watch -> phone)  1 TEMPERATURE (°F, as upstream; the watch converts)  2 CONDITIONS (WMO code)
//   3 SUNRISE  4 SUNSET (epoch seconds; 0 = unknown, the watch then uses hour-based time of day)
//   5 TEMP_UNIT (1 = °F)
// FWD v0.04.00 settings (bundled settings page src/pkjs/config.html -> 'configmessage' here -> watch):
//   7 TYPE_STYLE (1-5)  8 SMOKE_BT (0/1)  9 LIGHT_BATTERY (0/1)  10 LIGHT_LOW_PCT (10-90)
//   (6 was TIME_FORMAT, deprecated v0.02.00; not reused)
// Stored on the phone (localStorage 'settings') for the page, and on the watch (persist) for drawing.

// condition_code -> a WMO code that main.c's wmo_to_cond() maps to the intended scene.
// heavy_rain -> rain (as upstream showed heavy rain); rain_and_snow -> snow. Operator decision
// 2026-11-15, to be revisited with the artwork. 'unknown' is not sent: the last scene stays.
var CONDITION_TO_WMO = {
  sun: 0, partly_cloudy: 2, cloudy: 3,
  light_rain: 61, heavy_rain: 65,
  light_snow: 71, heavy_snow: 75, rain_and_snow: 73
};

var s_weather = null;   // properties of weather/location instances[0]
var s_unitF = null;     // true/false once preferences/units arrives
var s_pending = null;   // next message to send
var s_sending = false;
var s_retries = 0;
var s_pendingSettings = null;  // { msg, cb } for the next settings send

var SETTINGS_KEY = 'settings';
var SETTINGS_DEFAULTS = { type_style: 3, smoke_bt: true, light_battery: true, light_low_pct: 40 };  // 3 = Digital Large
function loadSettings() {
  var s = null, d = SETTINGS_DEFAULTS, out = {};
  try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch (e) { s = null; }
  for (var k in d) out[k] = (s && s[k] !== undefined) ? s[k] : d[k];
  return out;
}
function settingsMessage(s) {
  return { 7: s.type_style | 0, 8: s.smoke_bt ? 1 : 0, 9: s.light_battery ? 1 : 0, 10: s.light_low_pct | 0 };
}
function queueSettings(s, cb) {
  s_pendingSettings = { msg: settingsMessage(s), cb: cb };
  if (!s_sending) setTimeout(flush, 0);
}

function prop(p, name, shape) { return p && p[name] && p[name][shape]; }

function buildMessage() {
  if (!s_weather) return null;
  var t = prop(s_weather, 'temperature', 'numericValue');
  var srcF = t && t.unit === '°F';
  var wantF = s_unitF !== null ? s_unitF : !!srcF;
  var msg = {};
  if (t && typeof t.value === 'number') msg[1] = Math.round(srcF ? t.value : t.value * 9 / 5 + 32);
  var code = prop(s_weather, 'condition_code', 'longText');
  code = code && code.text;
  if (CONDITION_TO_WMO.hasOwnProperty(code)) msg[2] = CONDITION_TO_WMO[code];
  var sr = prop(s_weather, 'sunrise', 'timestamp'), ss = prop(s_weather, 'sunset', 'timestamp');
  msg[3] = sr && sr.value ? Math.round(sr.value) : 0;
  msg[4] = ss && ss.value ? Math.round(ss.value) : 0;
  msg[5] = wantF ? 1 : 0;
  return msg;
}

// One message in flight; never send from inside an ack callback (Test Bench finding).
function queueSend() {
  var msg = buildMessage();
  if (!msg) return;
  s_pending = msg;
  if (!s_sending) setTimeout(flush, 0);
}

function flush() {
  if (s_sending) return;
  if (s_pendingSettings) {  // settings first: the page is waiting for the answer
    var job = s_pendingSettings;
    s_pendingSettings = null;
    s_sending = true;
    Pebble.sendAppMessage(job.msg,
      function () { console.log('Settings sent: ' + JSON.stringify(job.msg)); s_sending = false; job.cb && job.cb(true); setTimeout(flush, 0); },
      function (e) { console.log('Settings send error: ' + JSON.stringify(e)); s_sending = false; job.cb && job.cb(false); setTimeout(flush, 0); });
    return;
  }
  if (!s_pending) return;
  var msg = s_pending;
  s_pending = null;
  s_sending = true;
  Pebble.sendAppMessage(msg,
    function () {
      console.log('Weather sent: ' + JSON.stringify(msg));
      s_sending = false; s_retries = 0;
      setTimeout(flush, 0);
    },
    function (e) {
      console.log('Send error: ' + JSON.stringify(e));
      s_sending = false;
      if (!s_pending && s_retries < 3) { s_retries++; s_pending = msg; }
      setTimeout(flush, 2000);
    });
}

Pebble.addEventListener('ready', function () {
  // Re-send stored settings, so the watch matches the page after a reinstall (its persist is cleared).
  if (localStorage.getItem(SETTINGS_KEY)) queueSettings(loadSettings());
  Pebble.subscribeToSource({
    category: 'preferences', item: 'units',
    onData: function (env) {
      var u = env.instances && env.instances[0] && prop(env.instances[0].properties, 'temperature', 'shortText');
      if (u && (u.text === '°F' || u.text === '°C')) s_unitF = u.text === '°F';
      console.log('preferences/units temperature: ' + (u && u.text));
      queueSend();
    },
    onError: function (e) { console.log('preferences/units error: ' + e.code + ' ' + e.message); }
  });
  Pebble.subscribeToSource({
    category: 'weather', item: 'location',
    properties: ['temperature', 'condition_code', 'sunrise', 'sunset'],
    onData: function (env) {
      var here = env.instances && env.instances[0];
      if (!here) { console.log('weather/location: no locations'); return; }
      s_weather = here.properties;
      console.log('weather/location ' + here.instanceId + ': ' + JSON.stringify(s_weather));
      queueSend();
    },
    onError: function (e) { console.log('weather/location error: ' + e.code + ' ' + e.message); }
  });
});

// The watch asks on launch and every 30 minutes; the subscriptions keep the data fresh, so
// re-send the latest reading.
Pebble.addEventListener('appmessage', function (e) {
  if (e.payload['0'] !== undefined || e.payload.REQUEST_WEATHER !== undefined) {
    console.log('Watch requested weather update');
    queueSend();
  }
});

// FWD v0.04.00: the bundled settings page (src/pkjs/config.html).
Pebble.addEventListener('configmessage', function (e) {
  var msg = e.data || {};
  if (msg.type === 'get') { e.respond({ settings: loadSettings() }); return; }
  if (msg.type === 'set' && msg.settings) {
    var s = loadSettings();
    for (var k in SETTINGS_DEFAULTS) if (msg.settings[k] !== undefined) s[k] = msg.settings[k];
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    queueSettings(s, function (ok) { e.respond({ ok: ok }); });
    return;
  }
  e.respond({ error: 'unknown type' });
});
