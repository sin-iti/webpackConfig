import { StWebpackConfig } from "./tool/class/StWebpackConfig";

let configer = new StWebpackConfig();

configer.addEntry("a/b")

let config = configer.loadBaseConfig();

export default config;


