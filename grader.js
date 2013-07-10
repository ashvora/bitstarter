#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.  Uses commander.js and cheerio. Teaches command line application development and basic DOM parsing.

References:

+ cheerio
  -https://github.com/MatthewMueller/cheerio
  -http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
  -http://maxogden.com/scraping-with-node.html

+ commander.js
  -https://github.com/visionmedia/commander.js
  -http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

+ JSON
  -http://en.wikipedia.org/wiki/JSON
  -https://developer.mozilla.org/en-US/docs/JSON
  -https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio=require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT="index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); //http://nodejs.org/api/process.html#process_process_exit_code
	}
    return instr;
};

/* Takes in filename, grabs the content as a file stream and loads into Cheerio*/
var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

/* Takes in filename, grabs the content as a file stream and loads into the JSON parser */
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

/* New function overloading checkHtmlFile */

var checkHtmlFileWrapper = function(input, check, isFilename) {
//    console.log("Inside the checkHtmlFileWrapper function");
    if (isFilename) {
//	console.log("Branch 1");
	return checkHtmlFile(input, check);
    } else {
//	console.log("Branch 2");
//        console.log("value of input: %s", input);
	$ = cheerio.load(input);
	var checks = loadChecks(check).sort();
	var out = {};
	for (var ii in checks) {
	var present = $(checks[ii]).length>0;
	out[checks[ii]]= present;
	}
//      console.log("Value of out: %s", out);
      return out;
    }
};



/* Takes in a filename and a checksfile and runs the verification routine */
var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
     }
return out;
};


var clone = function(fn) {
    //Workaround for commander.js issue.
    //http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var gradeIt = function(isURL) {
  if(isURL) {
    //console.log("Inside the isURL branch of gradeIt");
    rest.get(program.url).on('complete', function(result) {
	if(result instanceof Error) {
	console.log('Error: ' + result.message);
	this.retry(5000);
	} else {
	var URLContent = result;
	//console.log("This is the value of URLContent %s", result);
	var checkJson =checkHtmlFileWrapper(URLContent, program.checks, false);
	var outJson=JSON.stringify(checkJson, null, 4);
	console.log(outJson);
	}
    });


  } else {
//    console.log("Executing code for file processing.");
    var checkJson = checkHtmlFileWrapper(program.file, program.checks, true);
    var outJson=JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <URL>', 'URL of website to test')
    .parse(process.argv);

    var checkJson;
    if (program.url) {
      gradeIt(true);
    } else {
      gradeIt(false);
    }

    //var checkJson = checkHtmlFile(program.file, program.checks);
    //var outJson = JSON.stringify(checkJson, null, 4);
    //console.log(outJson);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
