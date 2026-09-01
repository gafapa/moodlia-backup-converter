import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync, strToU8 } from "fflate";

const outputDirectory = resolve(".tmp");
const outputPath = resolve(outputDirectory, "demo-modern-course.mbz");

const files = {
  "moodle_backup.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<moodle_backup><information>
  <moodle_version>2025041400</moodle_version><moodle_release>5.0</moodle_release>
  <backup_version>2025041400</backup_version><backup_release>5.0</backup_release>
  <contents><activities>
    <activity><moduleid>12</moduleid><contextid>101</contextid><modulename>forum</modulename><title>Forum</title><directory>activities/forum_12</directory></activity>
    <activity><moduleid>27</moduleid><contextid>102</contextid><modulename>subsection</modulename><title>Advanced unit</title><directory>activities/subsection_27</directory></activity>
  </activities></contents>
</information></moodle_backup>`),
  "course/course.xml": strToU8("<course><fullname>Demo course</fullname><pdfexportfont>freesans</pdfexportfont></course>"),
  "sections/section_1/section.xml": strToU8("<section><sequence>12,27</sequence><component>core</component><itemid>8</itemid></section>"),
  "activities/forum_12/module.xml": strToU8("<module><id>12</id></module>"),
  "activities/subsection_27/module.xml": strToU8("<module><id>27</id></module>"),
  "files.xml": strToU8("<files />"),
  "settings.xml": strToU8("<settings />"),
};

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputPath, zipSync(files));
console.log(outputPath);
