/**
 * Created by ling on 2015/4/2.
 */
module.exports = function (grunt) {
    'use strict';
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
            vendor: {
                // the files to concatenate
                src: [
                    /*highlight*/
                    '<%= pkg.javascripts.vendor %>highlight/highlight.js',
                    /*bootstrap*/
                    '<%= pkg.javascripts.vendor %>bootstrap/bootstrap.js',
                    /*markdown*/
                    '<%= pkg.javascripts.vendor %>markdown/he.js',
                    '<%= pkg.javascripts.vendor %>markdown/marked.js',
                    '<%= pkg.javascripts.vendor %>markdown/to-markdown.js',
                    '<%= pkg.javascripts.vendor %>markdown/jsHtmlToText.js',
                    '<%= pkg.javascripts.vendor %>markdown/undo.js',
                    '<%= pkg.javascripts.vendor %>markdown/tab.js',
                    '<%= pkg.javascripts.vendor %>markdown/config.js',
                    '<%= pkg.javascripts.vendor %>markdown/emoji.js',
                    '<%= pkg.javascripts.vendor %>markdown/bootstrap-markdown.js',
                    '<%= pkg.javascripts.vendor %>markdown/locale/*.js'
                ],
                // the location of the resulting JS file
                dest: 'dist/javascripts/<%= pkg.name%>.vendor.js'
            },
            user: {
                // the files to concatenate
                src: [
                    '<%= pkg.javascripts.user %>*.js',
                    '<%= pkg.javascripts.user %>**/*.js',
                    '<%= pkg.javascripts.user %>**/**/*.js'
                ],
                // the location of the resulting JS file
                dest: 'dist/javascripts/<%= pkg.name%>.user.js'
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                //������������
                mangle: {
                    except: ['jquery', 'marked', 'toMarkdown', 'markdown', 'htmlToText', 'hljs', 'Undo']
                },
                preserveComments: false,
                sourceMap: true,
                //���ѹ���ʣ���ѡ��ֵ�� false(�������Ϣ)��gzip
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
            vendor: {
                options: {
                    sourceMapName: "dist/javascripts/<%= pkg.name %>.vendor.min.map"
                },
                files: {
                    'dist/javascripts/<%= pkg.name %>.vendor.min.js': ['<%= concat.vendor.dest %>']
                }
            },
            user: {
                options: {
                    sourceMapName: "dist/javascripts/<%= pkg.name %>.user.min.map"
                },
                files: {
                    'dist/javascripts/<%= pkg.name %>.user.min.js': ['<%= concat.user.dest %>']
                }
            }
        },
        cssmin: {
            options: {
                keepSpecialComments: 0,
                report: 'gzip'
            },
            vendor: {
                files: {
                    'dist/stylesheets/<%= pkg.name %>.vendor.css': [
                        '<%= pkg.stylesheets.vendor %>*.css',
                        '<%= pkg.stylesheets.vendor %>**/*.css',
                        '<%= pkg.stylesheets.vendor %>**/**/*.css'
                    ]
                }
            },
            user: {
                files: {
                    'dist/stylesheets/<%= pkg.name %>.user.css': [
                        '<%= pkg.stylesheets.user %>*.css',
                        '<%= pkg.stylesheets.user %>**/*.css',
                        '<%= pkg.stylesheets.user %>**/**/*.css'
                    ]
                }
            }
        },
        copy: {
            lib: {
                expand: true,
                cwd: '<%= pkg.javascripts.vendor %>jquery/',
                src: [
                    '*.js',
                    '**/*.js',
                    '*.map',
                    '**/*.map'
                ],
                dest: 'dist/javascripts/'
            },
            fonts: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= pkg.stylesheets.fonts%>',
                        src: [
                            '*.eot',
                            '*.svg',
                            '*.ttf',
                            '*.woff',
                            '*.woff2'
                        ],
                        dest: 'dist/fonts/'
                    }
                ]
            },
            img: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= pkg.stylesheets.imgs%>',
                        src: [
                            '*.*',
                            '**/*.*',
                            '**/**/*.*'
                        ],
                        dest: 'dist/imgs/'
                    }
                ]
            },
            emoji: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= pkg.stylesheets.emoji%>',
                        src: [
                            '*.css'
                        ],
                        dest: 'dist/emoji/'
                    }
                ]
            }
        },
        watch: {
            options: {
                event: ['all'],
                dateFormat: function (time) {
                    grunt.log.writeln('The watch finished in ' + time + 'ms at' + (new Date()).toString());
                    grunt.log.writeln('Waiting for more changes...');
                }
            },
            jsuser: {
                files: [
                    '<%= pkg.javascripts.user %>*.js',
                    '<%= pkg.javascripts.user %>**/*.js',
                    '<%= pkg.javascripts.user %>**/**/*.js'
                ],
                tasks: ['concat:user', 'uglify:user']
            },
            jsvendor: {
                files: [
                    '<%= pkg.javascripts.vendor %>*.js',
                    '<%= pkg.javascripts.vendor %>**/*.js',
                    '<%= pkg.javascripts.vendor %>**/**/*.js'
                ],
                tasks: ['concat:vendor', 'uglify:vendor']
            },
            cssuser: {
                files: [
                    '<%= pkg.stylesheets.user %>*.css',
                    '<%= pkg.stylesheets.user %>**/*.css',
                    '<%= pkg.stylesheets.user %>**/**/*.css'
                ],
                tasks: ['cssmin:user']
            },
            cssvendor: {
                files: [
                    '<%= pkg.stylesheets.vendor %>*.css',
                    '<%= pkg.stylesheets.vendor %>**/*.css',
                    '<%= pkg.stylesheets.vendor %>**/**/*.css'
                ],
                tasks: ['cssmin:vendor']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('resource', ['copy']);

    grunt.registerTask('css', ['cssmin:vendor', 'cssmin:user']);

    grunt.registerTask('js', ['concat:vendor', 'concat:user', 'uglify:vendor', 'uglify:user']);

    // the default task can be run just by typing "grunt" on the command line
    grunt.registerTask('default', ['copy', 'css', 'js']);

};