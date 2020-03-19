2020-03-19, Version 4.5.2
=========================

 * Exclude 'deps' and '.github' from npm publish (Dominique Emond)

 * tests: id column should be convered and mapped; (Agnes Lin)

 * chore: update copyrights year (Diana Lau)


2019-12-19, Version 4.5.1
=========================

 * buildQueryColumns should return columns in order (ataft)

 * chore: update CODEOWNERS file (Diana Lau)

 * chore: improve issue and PR templates (Nora)


2019-11-01, Version 4.5.0
=========================

 * Allow CLOB/BLOB data types for migration (ataft)

 * Only callback after the connection is released (Raymond Feng)

 * Fix eslint violations (Raymond Feng)


2019-09-19, Version 4.4.0
=========================

 * temp (Hage Yaapa)

 * update oracledb to v4 (Nora)


2019-07-25, Version 4.3.0
=========================

 * fix eslint violations (Nora)

 * update dependencies (Nora)

 * run shared tests from both v3 and v4 of juggler (Nora)

 * drop support for node.js 6 (Nora)


2019-05-22, Version 4.2.0
=========================

 * Added the connection property "_enableStats" (Eric Alves)


2018-12-07, Version 4.1.2
=========================

 * chore: update CODEOWNERS (Diana Lau)

 * Upgrade to oracledb 3.x (Joost de Bruijn)


2018-09-19, Version 4.1.1
=========================

 * update strong-globalize to 4.x (Diana Lau)


2018-08-07, Version 4.1.0
=========================

 * remove unnecessary text (Diana Lau)

 * Update to MIT license (Diana Lau)


2018-07-16, Version 4.0.2
=========================

 * fix schema/owner for discovery (Raymond Feng)


2018-07-10, Version 4.0.1
=========================

 * [WebFM] cs/pl/ru translation (candytangnb)


2018-05-23, Version 4.0.0
=========================

 * Upgrade to oracledb 2.x (Raymond Feng)

 * Fix datatypeChanged for fields with length (Joost de Bruijn)

 * fix typo in readme (#150) (Biniam Admikew)

 * Add stalebot configuration (Kevin Delisle)

 * Create Issue and PR Templates (#143) (Sakib Hasan)

 * Update translated strings Q3 2017 (Allen Boone)

 * update messages.json (Diana Lau)

 * Add CODEOWNER file (Diana Lau)

 * Require init on mocha args (ssh24)

 * Add docker setup (#130) (Biniam Admikew)


2017-04-18, Version 3.2.0
=========================

 * Use fetchAsString for CLOB (Raymond Feng)


2017-03-31, Version 3.1.1
=========================

 * Change node vers. (#122) (Rand McKinney)


2017-03-06, Version 3.1.0
=========================

 * Upgrade to loopback-connector@4.x (Raymond Feng)

 * Upgrade deps and fix styles (Raymond Feng)

 * Add regexp support (Raymond Feng)

 * Refactor migration methods (ssh24)

 * Refactor discovery methods (Loay Gewily)

 * Update test script (Loay Gewily)

 * Replicate new issue_template from loopback (Siddhi Pai)

 * Replicate issue_template from loopback repo (Siddhi Pai)

 * Update LB connector version (Loay)

 * Update readme (#102) (Rand McKinney)

 * Allow oracledb settings to be honored at pool/execution levels (Raymond Feng)

 * Update paid support URL (Siddhi Pai)


2016-11-29, Version 3.0.0
=========================

 * Update installer dep (Raymond Feng)

 * Move config to installer (#93) (Rashmi Hunt)

 * Drop support for Node v0.10 and v0.12 (Miroslav Bajtoš)

 * Remove the obselete example (Raymond Feng)

 * Update README doc link (Candy)

 * fixed a space (rashmihunt)

 * fixed link to node-oracledb (rashmihunt)

 * Add connectorCapabilities global object (#83) (Nicholas Duffy)

 * Update translation files - round#2 (Candy)

 * Add translated files (gunjpan)

 * Add eslint infrastructure (Candy)

 * Update deps to loopback 3.0.0 RC (Miroslav Bajtoš)

 * Run CI with juggler3 (Loay)

 * Update strong-globalize to 2.6.2 (Simon Ho)

 * Add globalization (Simon Ho)

 * Update URLs in CONTRIBUTING.md (#67) (Ryan Graham)

 * Fix package.json to use oracle installer (Raymond Feng)

 * Update dependencies (Raymond Feng)

 * Check lob type (Raymond Feng)

 * Fix the merge issue (Raymond Feng)

 * Upgrade to oracledb 1.0 (Raymond Feng)

 * Update to oracledb driver 0.5.0 (Raymond Feng)

 * Support more config properties (Raymond Feng)

 * Port to the oracledb driver (Raymond Feng)

 * Use try-catch to test error message (jannyHou)

 * update copyright notices and license (Ryan Graham)

 * Lazy connect when booting from swagger generator (juehou)


2016-03-04, Version 2.4.1
=========================

 * Remove license check (Raymond Feng)


2016-03-04, Version 2.4.0
=========================



2016-02-19, Version 2.3.1
=========================

 * Remove sl-blip from dependencies (Miroslav Bajtoš)

 * Add NOTICE (Raymond Feng)

 * Upgrade should to 8.0.2 (Simon Ho)


2015-12-03, Version 2.3.0
=========================

 * Upgrade oracle driver version (Raymond Feng)

 * Refer to licenses with a link (Sam Roberts)

 * Use strongloop conventions for licensing (Sam Roberts)

 * Fix the test to make it agnositic to the order of columns (Raymond Feng)

 * Tidy up tests (Raymond Feng)

 * Increase the timeout (Raymond Feng)


2015-08-01, Version 2.2.0
=========================

 * Update link (Raymond Feng)

 * Add ORA-22408 troubleshooting notes (Simon Ho)


2015-05-18, Version 2.1.0
=========================

 * Update deps (Raymond Feng)

 * Add transaction support (Raymond Feng)


2015-05-13, Version 2.0.0
=========================

 * Update deps (Raymond Feng)

 * Refactor the oracle connector to use base SqlConnector (Raymond Feng)

 * Fix the trigger so that it is only invoked when the id is not set (Raymond Feng)

 * Update the README (Raymond Feng)


2015-03-26, Version 1.7.0
=========================

 * Upgrade oracle driver to pass all tests (Raymond Feng)

 * Return count when updating or deleting models (Simon Ho)

 * Improve concurrency for testing (Raymond Feng)

 * Add strongloop license check (Raymond Feng)

 * Add instructions to running tests section (Simon Ho)


2015-02-20, Version 1.6.0
=========================

 * Fix test failures with juggler@2.18.1 (Raymond Feng)

 * Tweaked Node version caveat. (Rand McKinney)

 * Caveat re Node v 0.11 per Al (Rand McKinney)


2015-01-09, Version 1.5.0
=========================

 * Update deps (Raymond Feng)

 * Fix SQL injection (Raymond Feng)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-12-05, Version 1.4.5
=========================

 * Map required/id properties to NOT NULL (Raymond Feng)


2014-11-27, Version 1.4.4
=========================

 * Add contribution guidelines (Ryan Graham)


2014-09-11, Version 1.4.3
=========================

 * Bump versions (Raymond Feng)

 * Make sure errors are reported during automigrate/autoupdate (Raymond Feng)

 * Change "Unbuntu" to "Ubuntu" in readme (superkhau)


2014-08-21, Version 1.4.2
=========================

 * Bump version (Raymond Feng)

 * Add ping() (Raymond Feng)


2014-06-27, Version 1.4.1
=========================

 * Bump versions (Raymond Feng)

 * Tidy up filter.order parsing (Raymond Feng)

 * Update link to doc (Rand McKinney)


2014-06-23, Version 1.4.0
=========================

 * Bump version (Raymond Feng)

 * Use base connector and add update support (Raymond Feng)

 * Fix comparison for null and boolean values (Raymond Feng)


2014-05-22, Version 1.3.0
=========================

 * Update to strong-oracle 1.2.0 (Raymond Feng)


2014-05-16, Version 1.2.1
=========================

 * Bump versions (Raymond Feng)

 * Add and/or (Raymond Feng)

 * Add support for logical operators (AND/OR) (Raymond Feng)

 * Allow schema settings (Raymond Feng)

 * ADL -> LDL (Raymond Feng)

 * Reformat code (Raymond Feng)

 * Update the license file (Raymond Feng)


2014-03-26, Version 1.2.0
=========================

 * Catch exception for disconnect (Raymond Feng)

 * Remove the disconnect() to avoid racing condition (Raymond Feng)

 * Remove dead comments (Raymond Feng)

 * Add clob test case (Raymond Feng)

 * Throw the 1st error (Raymond Feng)

 * Bump version and update deps (Raymond Feng)

 * Use parameterized query to handle CLOB (Raymond Feng)

 * Align the lines around 80 chars (Raymond Feng)

 * Reformat code (Raymond Feng)

 * Allow use TNS compiled string for connection (Sergey Nosenko)

 * Removed doc for discovery functions exposed by juggler. (crandmck)

 * Update license url (Raymond Feng)

 * Add the test case for connection pooling (Raymond Feng)

 * Update dep to node-oracle (Raymond Feng)

 * Make sure pooled connections are released (Raymond Feng)

 * Add debug info (Raymond Feng)

 * Enable connection pool (Raymond Feng)


2013-12-17, Version 1.1.5
=========================

 * Exposed the `Oracle` class/constructor (Salehen Shovon Rahman)

 * Ignore CI related files (Ryan Graham)

 * Use istanbul for optional code coverage (Ryan Graham)

 * Run tests more similar to how CI runs them (Ryan Graham)


2013-12-06, Version 1.1.4
=========================

 * Bump version (Raymond Feng)

 * Update juggler dep to be peer (Raymond Feng)

 * fix link to api.md (Rand McKinney)

 * Reword final heading (Rand McKinney)

 * add one space. (Rand McKinney)

 * Unfortunately, wiki macro doesn't like raw HTML in md.  Another try. (Rand McKinney)

 * Gave up and used HTML instead of md for table. (Rand McKinney)

 * Try to fix bullet list in 1st table (again) (Rand McKinney)

 * Try to fix bullet list in 1st table (Rand McKinney)

 * Fixed heading level. (Rand McKinney)

 * Update api.md (Rand McKinney)

 * Formatting fixes to make tables layout properly. (Rand McKinney)

 * Pulled API doc into separate .md file.  Deleted non-essential content moved to wiki. (Rand McKinney)

 * Moved discovery API documentation here. (Rand McKinney)

 * Update docs.json (Rand McKinney)


2013-11-20, Version 1.1.3
=========================

 * First release!
