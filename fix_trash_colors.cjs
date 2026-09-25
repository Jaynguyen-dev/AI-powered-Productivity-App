const fs = require("fs");
const path = require("path");

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith(".tsx")) results.push(file);
        }
    });
    return results;
}

const files = walk("src/components");

files.forEach(file => {
    let content = fs.readFileSync(file, "utf8");
    
    // We want to find the <button> or <div> that contains <Trash2
    // A simple way is to split by "<Trash2" and then look backwards to find the nearest "className="
    // and replace "blue" with "rose".
    
    let parts = content.split("<Trash2");
    if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
            let part = parts[i];
            let classIdx = part.lastIndexOf("className=");
            if (classIdx !== -1) {
                // The substring from classIdx to the end of the part is the class declaration
                let beforeClass = part.substring(0, classIdx);
                let classContent = part.substring(classIdx);
                
                // Replace 'blue' with 'rose' only inside the classContent
                classContent = classContent.replace(/text-blue-\d+/g, (m) => m.replace("blue", "rose"));
                classContent = classContent.replace(/bg-blue-\d+\/\d+/g, (m) => m.replace("blue", "rose"));
                
                parts[i] = beforeClass + classContent;
            }
        }
        fs.writeFileSync(file, parts.join("<Trash2"), "utf8");
        console.log("Updated", file);
    }
});
