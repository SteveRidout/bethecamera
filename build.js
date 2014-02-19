({
	baseUrl: ".",
	appDir: ".",
	dir: "../bethecamera.com",

	fileExclusionRegExp: /^\.git$/,

	paths: {
		'jquery': 'empty:',
		'jquery.ui': 'empty:'
	},
	
	modules: [
		{
			name: 'src/main'
		}
	]
})
