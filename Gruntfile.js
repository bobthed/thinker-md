module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                //separator: ';',
                // Replace all 'use strict' statements in the code
                process: function (src, filepath) {
                    return '// Source: ' + filepath + '\n' +
                        src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                }
            },
            dist: {
                // the files to concatenate
                src: [
                    /* jquery, jquery ui*/
                    '<%= pkg.dir.js.vendor %>jquery/*.js',
                    '<%= pkg.dir.js.vendor %>jquery/plugin/*.js',
                    '<%= pkg.dir.js.vendor %>jquery/plugin/fancybox/jquery.fancybox.js',
                    '<%= pkg.dir.js.vendor %>jquery/plugin/fancybox/jquery.fancybox-buttons.js',
                    '<%= pkg.dir.js.vendor %>jquery/plugin/fancybox/jquery.fancybox-media.js',
                    '<%= pkg.dir.js.vendor %>jquery/plugin/fancybox/jquery.fancybox-thumbs.js',
                    /*highlight*/
                    '<%= pkg.dir.js.vendor %>highlight/highlight.js',
                    /*bootstrap*/
                    '<%= pkg.dir.js.vendor %>bootstrap/bootstrap.js',
                    /*markdown*/
                    '<%= pkg.dir.js.vendor %>markdown/he.js',
                    '<%= pkg.dir.js.vendor %>markdown/marked.js',
                    '<%= pkg.dir.js.vendor %>markdown/to-markdown.js',
                    '<%= pkg.dir.js.vendor %>markdown/jsHtmlToText.js',
                    '<%= pkg.dir.js.vendor %>markdown/tab.js',
                    '<%= pkg.dir.js.vendor %>markdown/config.js',
                    '<%= pkg.dir.js.vendor %>markdown/bootstrap-markdown.js',
                    '<%= pkg.dir.js.vendor %>markdown/locale/*.js'

                ],
                // the location of the resulting JS file
                dest: 'dist/javascripts/vendor/<%= pkg.name %>.vendor.js'
            },
            user: {
                // the files to concatenate
                src: ['<%= pkg.dir.js.user %>*.js', '<%= pkg.dir.js.user %>**/*.js'],
                // the location of the resulting JS file
                dest: 'dist/javascripts/user/<%= pkg.name %>-user.js'
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                //不混淆变量名
                mangle: {
                    except: ['jquery', 'marked', 'toMarkdown', 'markdown', 'htmlToText', 'hljs']
                },
                preserveComments: false,
                sourceMap: true,
                //输出压缩率，可选的值有 false(不输出信息)，gzip
                report: "min",
                ASCIIOnly: 'true',
                beautify: {
                    "ascii_only": true
                },
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */',
                compress: {
                    drop_console: true,
                    "hoist_funs": false,
                    loops: false,
                    unused: false
                }
            },
            dist: {
                options: {
                    sourceMapName: "dist/javascripts/vendor/<%= pkg.name %>.vendor.min.map"
                },
                files: {
                    'dist/javascripts/vendor/<%= pkg.name %>.vendor.min.js': ['<%= concat.dist.dest %>']
                }
            },
            user: {
                options: {
                    sourceMapName: "dist/javascripts/user/<%= pkg.name %>-user.min.map"
                },
                files: {
                    'dist/javascripts/user/<%= pkg.name %>-user.min.js': ['<%= concat.user.dest %>']
                }
            }
        },
        cssmin: {
            options: {
                keepSpecialComments: 0,
                report: 'gzip'
            },
            dist: {
                files: {
                    'dist/stylesheets/vendor/<%= pkg.name %>.vendor.min.css': [
                        '<%= pkg.dir.css.vendor %>*.css',
                        '<%= pkg.dir.css.vendor %>**/*.css',
                        '<%= pkg.dir.css.vendor %>**/**/*.css'
                    ]
                }
            },
            user: {
                files: {
                    'dist/stylesheets/user/<%= pkg.name %>.user.min.css': [
                        '<%= pkg.dir.css.user %>*.css',
                        '<%= pkg.dir.css.user %>**/*.css',
                        '<%= pkg.dir.css.user %>**/**/*.css'
                    ]
                }
            }
        },
        copy: {
            fonts: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= pkg.dir.fonts%>',
                        src: [
                            '*.eot',
                            '*.svg',
                            '*.ttf',
                            '*.woff',
                            '*.woff2'
                        ],
                        dest: 'dist/stylesheets/fonts/'
                    }
                ]
            },
            img: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= pkg.dir.img%>',
                        src: [
                            '*.*',
                            '**/*.*',
                            '**/**/*.*'
                        ],
                        dest: 'dist/stylesheets/img/'
                    }
                ]
            }
        },
        watch: {
            jsuser: {
                files: [
                    '<%= pkg.dir.js.user %>*.js',
                    '<%= pkg.dir.js.user %>**/*.js',
                    '<%= pkg.dir.js.user %>**/**/*.js'
                ],
                tasks: ['concat:user', 'uglify:user']
            },
            jsvendor: {
                files: [
                    '<%= pkg.dir.js.vendor %>*.js',
                    '<%= pkg.dir.js.vendor %>**/*.js',
                    '<%= pkg.dir.js.vendor %>**/**/*.js'
                ],
                tasks: ['concat:dist', 'uglify:dist']
            },
            cssuser: {
                files: [
                    '<%= pkg.dir.css.user %>*.css',
                    '<%= pkg.dir.css.user %>**/*.css',
                    '<%= pkg.dir.css.user %>**/**/*.css'
                ],
                tasks: ['cssmin:user']
            },
            cssvendor: {
                files: [
                    '<%= pkg.dir.css.vendor %>*.css',
                    '<%= pkg.dir.css.vendor %>**/*.css',
                    '<%= pkg.dir.css.vendor %>**/**/*.css'
                ],
                tasks: ['cssmin:dist']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('resource', ['copy']);

    // the default task can be run just by typing "grunt" on the command line
    grunt.registerTask('default', ['concat:dist', 'concat:user', 'uglify:dist', 'uglify:user']);

    grunt.registerTask('css', ['cssmin:dist', 'cssmin:user']);

    grunt.task.run(['resource', 'default', 'css'])
};