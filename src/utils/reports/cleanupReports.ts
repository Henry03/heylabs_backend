import fs from "fs";
import path from "path";

export function cleanupReports(){

    const folder=

        path.join(
            process.cwd(),
            "public/generatedReport"
        );

    const files=

        fs.readdirSync(folder);

    const now=Date.now();

    for(const file of files){

        const full=

            path.join(folder,file);

        const stat=

            fs.statSync(full);

        const age=

            now-stat.mtimeMs;

        if(age>

            1000*60*60*24*180

        ){

            fs.unlinkSync(full);

        }

    }

}