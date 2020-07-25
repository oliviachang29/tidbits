require('dotenv').config()

const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginNavigation = require('@11ty/eleventy-navigation')
const markdownIt = require('markdown-it')
const axios = require('axios')

const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')
const iconsprite = require('./utils/iconsprite.js')

module.exports = function (config) {
    // Plugins
    config.addPlugin(pluginRss)
    config.addPlugin(pluginNavigation)

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // Transforms
    Object.keys(transforms).forEach((transformName) => {
        config.addTransform(transformName, transforms[transformName])
    })

    // Shortcodes
    Object.keys(shortcodes).forEach((shortcodeName) => {
        config.addShortcode(shortcodeName, shortcodes[shortcodeName])
    })

    const allTags = []

    config.addCollection('quotes', async (collection) => {
        let response = await axios.get(process.env.API_URL)
        console.log(process.env)
        collection = response.data

        collection.map((quote) => {
            quote.text = quote['fields']['Quote']

            quote.tags = quote['fields']['Tags']
            if (quote.tags) {
                quote.tags.forEach((tag) => {
                    if (!allTags.includes(tag)) allTags.push(tag)
                })
            }

            quote.source = quote['fields']['Source (Newspaper)']
            quote.author = quote['fields']['Author']
            quote.link = quote['fields']['Link']
            quote.date = new Date(quote['created'])
            return quote
        })

        collection.sort((a, b) => (a.date < b.date ? 1 : -1))

        return collection
    })

    config.addCollection('tags', function (collection) {
        collection = allTags

        collection.sort((a, b) => (a < b ? 1 : -1))

        return collection
    })

    // Icon Sprite
    config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

    // Asset Watch Targets
    config.addWatchTarget('./src/assets')

    // Markdown
    config.setLibrary(
        'md',
        markdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        })
    )

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('post', 'post.njk')

    // Pass-through files
    config.addPassthroughCopy('src/robots.txt')
    config.addPassthroughCopy('src/site.webmanifest')
    config.addPassthroughCopy('src/assets/images')
    config.addPassthroughCopy('src/assets/fonts')

    // Deep-Merge
    config.setDataDeepMerge(true)

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    }
}
