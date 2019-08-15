const { JSDOM } = require('jsdom')
const SVGO = require('svgo')
const fs = require('fs')
const fsPromises = fs.promises

const folder = '../alphabet2'
const resultFolder = `${folder}/result`
if (!fs.existsSync(resultFolder))
	fs.mkdirSync(resultFolder)

fsPromises.readdir(folder, { withFileTypes: true })
	.then(files => files.filter(file => file.name.endsWith('.svg')))
	.then(files => Promise.all(
		files.map(file => fsPromises.readFile(`${folder}/${file.name}`, 'utf8')
			.then(buffer => {
				const { document } = (new JSDOM(buffer.toString())).window
				const svg = document.querySelector('svg')
				const groups = document.querySelectorAll('svg>g')
				const result = []
				groups.forEach((group, index) => {
					// get what we need from each group
					const clip = group.querySelector('defs>path')
					const path = group.lastElementChild
					const id = `${file.name.replace('.svg', '')}_${index}`
					clip.removeAttribute('id')
					path.setAttribute('clip-path', `url(#${id})`)
					result.push({ file: file.name, clip, path, id })

					// clean up each group
					group.parentNode.removeChild(group)
					svg.appendChild(path)
				})

				stripAndWrite(`${resultFolder}/${file.name}`, document.body.innerHTML)
				return result
			})
		)
	))
	.then(results => {
		const { document } = (new JSDOM('<svg id="defs"><defs></defs></svg>')).window
		const defs = document.querySelector('svg>defs')
		results.forEach(result => {
			result.forEach(group => {
				const clipPath = document.createElement('clipPath')
				clipPath.setAttribute('id', group.id)
				clipPath.appendChild(group.clip)
				defs.appendChild(clipPath)
			})
		})
		stripAndWrite(`${resultFolder}/defs.svg`, document.body.innerHTML)
		// console.log(results)
	})


function stripAndWrite(file, data) {
	data = data.replace(/clippath/g, 'clipPath')
	svgo = new SVGO({
		plugins: [{
			cleanupAttrs: true,
		}, {
			removeDoctype: true,
		}, {
			removeXMLProcInst: true,
		}, {
			removeComments: true,
		}, {
			removeMetadata: true,
		}, {
			removeTitle: true,
		}, {
			removeDesc: true,
		}, {
			removeUselessDefs: true,
		}, {
			removeEditorsNSData: true,
		}, {
			removeEmptyAttrs: true,
		}, {
			removeHiddenElems: true,
		}, {
			removeEmptyText: true,
		}, {
			removeEmptyContainers: true,
		}, {
			removeViewBox: false,
		}, {
			cleanupEnableBackground: true,
		}, {
			convertStyleToAttrs: true,
		}, {
			convertColors: true,
		}, {
			convertPathData: true,
		}, {
			convertTransform: true,
		}, {
			removeUnknownsAndDefaults: true,
		}, {
			removeNonInheritableGroupAttrs: true,
		}, {
			removeUselessStrokeAndFill: true,
		}, {
			removeUnusedNS: true,
		}, {
			cleanupIDs: true,
		}, {
			cleanupNumericValues: true,
		}, {
			moveElemsAttrsToGroup: true,
		}, {
			moveGroupAttrsToElems: true,
		}, {
			collapseGroups: true,
		}, {
			removeRasterImages: true,
		}, {
			mergePaths: false,
		}, {
			convertShapeToPath: true,
		}, {
			sortAttrs: true,
		}, {
			removeDimensions: true,
		}, {
			removeAttrs: { attrs: '(stroke|fill|stroke-linecap|stroke-linejoin|stroke-width|stroke-miterlimit)' },
		}]
	})
	
	svgo.optimize(data)
	.then(({data}) => {
		fsPromises.writeFile(file, data)
	})
}