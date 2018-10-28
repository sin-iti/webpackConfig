import * as webpack from "webpack";
import * as path from "path";
import * as fs from "fs";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";
let rootDir = path.resolve(__dirname, "../../");

export namespace StWebpackConfig {
    export type EntryType = "ts" | "es6" | "js";
    export type EntryObj = {
        [name: string]: string;
    }
    export interface Loaded {
        [name: string]: boolean;
    }
    export type StyleSrcType = "scss" | "less" | "css" | "";
}

export class StWebpackConfig {
    private config: webpack.Configuration = {
        entry: {},
        output: {
            path: '',
            filename: '[name].js',
            publicPath: ""  
        },
        mode: "development",
        plugins: [], devtool: "source-map",
        target: "web",
        resolve: {
            extensions: [".ts", ".scss", ".less", ".es6", ".css", ".js"],
            alias: {}
        },
        module: {
            rules: []
        }
    };

    protected loadState: StWebpackConfig.Loaded = {
        miniCssPlugin: false,
        sourceMapPlugin: false,
        uglifyJsPlugin: false,
        scssRule: false,
        lessRule: false,
        tsRule: false,
        es6Rule: false,
    };

    public srcDir: string = path.resolve(rootDir, "src");

    protected distDir: string = path.resolve(rootDir, "dist");

    public entryName: string = 'entry';

    public styleSrcType: StWebpackConfig.StyleSrcType = "scss";

    public autoAddFile: boolean = true;


    public updateDist(dist: string) {
        this.distDir = dist;
        return this;
    }

    public addEntry(name: string, type: StWebpackConfig.EntryType = "ts"): this {
        let basename = name + '.' + type;
        let relativeName = path.join(this.entryName, basename)
        let filename = path.resolve(this.srcDir, relativeName);
        if (this.autoAddFile) {
            this.addFileIfNotExists(relativeName, this.srcDir);
        }
        this.config.entry[name] = filename;
        return this;
    }

    public addFileIfNotExists(filename: string, prefixName: string = '') {
        let absFilename = path.join(prefixName, filename);
        if (!fs.existsSync(absFilename)) {
            let filenameParse = path.parse(filename);
            let relativeName = filenameParse.dir;
            let parts = relativeName.split(path.sep);
            let dir = prefixName;
            for (let part of parts) {
                dir = path.join(dir, part);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }
            let extname = filenameParse.ext;
            let baseName = filenameParse.name;
            this.echo(`write ${absFilename}`);
            fs.writeFileSync(absFilename, this.initFileData(baseName, extname), { encoding: "utf8" });
            if (this.styleSrcType) {
                let styleFile = path.join(dir, baseName + `.${this.styleSrcType}`);
                this.echo(`write ${styleFile}`);
                fs.writeFileSync(styleFile, this.initFileData(baseName, `.${this.styleSrcType}`), { encoding: "utf8" });
            }
        }
        return this;
    }
    protected initFileData(filename: string, extname: string): string {
        let data = '';
        switch (extname) {
            case '.ts':
                data = `


import "./${filename}.${this.styleSrcType}";


                `;
                break;
        }
        return data;
    }

    public loaded(name: string): this {
        this.loadState[name] = true;
        return this;
    }

    public addMiniCssPlugin() {
        if (this.loadState.miniCssPlugin) {
            return this;
        }
        let miniCssExtractor = new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        });        
        this.loadState.miniCssExtractor = true;
        return this.addPlugin(miniCssExtractor);
    }

    public addUglifyJsPlugin(): this {
        if (this.loadState.uglifyJsPlugin) {
            return this;
        }
        this.loadState.uglifyJsPlugin = true;
        let option: UglifyJsPlugin.UglifyJsPluginOptions = {
            sourceMap: true,
            uglifyOptions: {
                compress: {
                    warnings: true,
                    drop_debugger: false,
                    drop_console: false
                }
            }
        };
        if (this.config.mode === "production") {
            option.sourceMap = false;
            option.uglifyOptions = {
                compress: {
                    drop_console: true,
                    pure_funcs: ["console.error"]
                }
            }
        }
        let jsUglifier = new UglifyJsPlugin(option);
        return this.addPlugin(jsUglifier);
    }

    public addSourceMapperPlugin(): this {
        if (this.loadState.sourceMapPlugin) {
            return this;
        }
        this.loaded("sourceMapPlugin");
        let sourceMaper = new webpack.SourceMapDevToolPlugin({
            filename: '[name].js.map',
        });
        return this.addPlugin(sourceMaper);
    }

    public addPlugin(plugins: webpack.Plugin): this {
        this.config.plugins.push(plugins);
        return this;
    }

    public echo(str: any, name: string = '') {
        console.log(`-------${name}--------->`);
        console.log(str);
        console.log(`<-------${name}---------`);
    }
    public addRule(rule: webpack.RuleSetRule): this {
        this.config.module.rules.push(rule);
        return this;
    }
    public addBaseRule(): this {
        return this.addTsRule().addScssRule().addLessRule().addEs6Rule();
    }
    public addLessRule(): this {
        if (this.loadState.lessRule) {
            return this;
        }
        this.loaded("lessRule");
        let self = this;
        return this.addRule({
            test: /\.less$/,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "postcss-loader",
                "less-loader"
            ],
            include: [self.srcDir]
        });
    }
    public addScssRule(): this {
        if (this.loadState.scssRule) {
            return this;
        }
        this.loaded("scssRule");
        let self = this;
        return this.addRule({
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "postcss-loader",
                "sass-loader"
            ],
            include: [self.srcDir]
        });
    }
    public addTsRule(): this {
        if (this.loadState.tsRule) {
            return this;
        }
        this.loaded("tsRule");
        let self = this;
        return this.addRule({
            test: /\.ts$/,
            loader: "ts-loader",
            include: [self.srcDir]
        });
    }
    public addEs6Rule() {
        if (this.loadState.es6Rule) {
            return this;
        }
        this.loaded("es6Rule");
        let self = this;
        return this.addRule({
            test: /\.es6$/,
            loader: "babel-loader",
            include: [self.srcDir]
        });
    }

    public export() {
        this.config.output.path = this.distDir;
        return this.copy(this.config);
    }
    public copy<T>(obj: T): T {
        let copied;
        if (obj instanceof Array) {
            let arr = [];     
            for(let item of obj) {
                arr.push(item);
            }
            copied = arr;
        } else {
            copied = <T>{};
            for (let attr in obj) {
                let val = obj[attr];
                if (typeof val === "object") {
                    copied[attr] = this.copy(val);
                } else {
                    copied[attr] = val;
                }
            }
        }        
        return copied;
    }

    public updateMode(mode: "production" | "none" | "development" = "development"): this {
        this.config.mode = mode;
        return this;
    }

    public toProMode(): this {
        return this.updateMode("production");
    }


    public addBasePlugin(): this {
        return this.addUglifyJsPlugin().addSourceMapperPlugin().addMiniCssPlugin();
    }

    public loadBaseConfig(): webpack.Configuration {
        return this.addBasePlugin().addBaseRule().export();
    }
}

