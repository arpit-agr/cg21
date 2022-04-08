const esbuild = require("esbuild");
const imageShortcode = require("./src/_11ty/shortcodes/image");
const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const { DateTime } = require("luxon");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const sortByDisplayOrder = require('./src/_11ty/utils/sort-by-display-order.js');

module.exports = function (eleventyConfig) {

	//DATA DEEP MERGE DEFAULTS TO TRUE IN 1.0
	eleventyConfig.setDataDeepMerge(false);

	//PLUGIN
	eleventyConfig.addPlugin(EleventyRenderPlugin);
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	//FILTER
	eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });
	eleventyConfig.addFilter("postDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
	});
	eleventyConfig.addFilter("limit", function (arr, limit) {
		return arr.slice(0, limit);
	});
	eleventyConfig.addFilter("pluck", function (arr, selections, attr) {
		return arr.filter((item) => selections.includes(item.data[attr]));
	});

	//PASSTHROUGH COPY
	eleventyConfig.addPassthroughCopy("./src/fonts");
	eleventyConfig.addPassthroughCopy("./src/img");
	eleventyConfig.addPassthroughCopy("./src/scripts");
	eleventyConfig.addPassthroughCopy("./src/admin");

	//SHORTCODE
	eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

	//WATCH TARGET
	eleventyConfig.addWatchTarget("./src/css/");
	eleventyConfig.addWatchTarget('./src/build-scripts/');
	eleventyConfig.addWatchTarget('./src/scripts/');

	// COLLECTIONS
	eleventyConfig.addCollection("posts", function(collectionApi) {
		return collectionApi.getFilteredByGlob("./src/posts/*.md");
	});
	eleventyConfig.addCollection("testimonials", function(collectionApi) {
		return sortByDisplayOrder(collectionApi.getFilteredByGlob("./src/testimonials/*.md"));
	});

	//ELEVENTY AFTER EVENT
	eleventyConfig.on('eleventy.after', async () => {
    // Run me after the build ends
		return esbuild.build({
      entryPoints: ['src/build-scripts/globe.js', 'src/build-scripts/lite-yt-embed.js'],
      bundle: true,
			minify: true,
      outdir: 'public/scripts'
    });
  });

	//TRANSFORM
	eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if( outputPath && outputPath.endsWith(".html") ) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }

    return content;
  });

	return {
		htmlTemplateEngine: "njk",
		markdownTemplateEngine: "njk",
		dir: {
			input: 'src',
			output: 'public'
		}
	};
};