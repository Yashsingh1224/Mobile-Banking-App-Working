const brotli = {
  compress(data) {
    return data;
  },
  decompress(data) {
    return data;
  },
};

module.exports = Promise.resolve(brotli);
