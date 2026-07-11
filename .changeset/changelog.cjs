const githubChangelog = require("@changesets/changelog-github");

module.exports = {
  async getReleaseLine(changeset, type, options) {
    const line = await githubChangelog.default.getReleaseLine(
      changeset,
      type,
      options,
    );
    return line.replace(/ Thanks \[@[^\]]+\]\([^)]+\)!/g, "");
  },
  async getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    return githubChangelog.default.getDependencyReleaseLine(
      changesets,
      dependenciesUpdated,
      options,
    );
  },
};
