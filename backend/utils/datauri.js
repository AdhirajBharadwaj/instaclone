import datauriParser from "datauri/parser.js";
import path from "path";

const parser=new datauriParser();

export const getDataUri=(file)=>{
    const extName=path.extname(file.originalname).toString();
    return parser.format(extName,file.buffer).content;
}
