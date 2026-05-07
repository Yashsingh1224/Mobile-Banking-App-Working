const runtimeGlobal = typeof globalThis !== "undefined" ? globalThis : global;

require("react-native-get-random-values");

const { Buffer } = require("buffer");
runtimeGlobal.Buffer = runtimeGlobal.Buffer || Buffer;
runtimeGlobal.process = runtimeGlobal.process || require("process");

require("fast-text-encoding");
