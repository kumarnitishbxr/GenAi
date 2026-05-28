import { GoogleGenAI, Type } from "@google/genai";
import 'dotenv/config'
import fs from 'fs'
import path from "path";

const ai = new GoogleGenAI({});

// create tool functions 
async function  listFile({directory}) {
    const files = [];
    const extension = [".js", ".jsx", ".ts", ".html", ".css", ".tsx"];// here we can add more file extension for review

    function scan(dir){
        const items = fs.readdirSync(dir)

        for (const item of items){
            const fullpath = path.join(dir,item);

            if(fullpath.includes('node_modules') || fullpath.includes('dist') || fullpath.includes('build')){
                continue;
            }

            const stat = fs.statSync(fullpath)

            if(stat.isDirectory()){
                scan(fullpath)
            }else if(stat.isFile()){
                const ext = path.extname(item)
                if(extension.includes(ext)){
                    files.push(fullpath)
                }
            }
        }
    }

    scan(directory);

    return {files};
}

async function readFile({ filePath }) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content };
}

async function writeFile({ filePath, content }) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
}

// maping the tools
const tools = {
  'list_file': listFile,
  'read_file': readFile,
  'write_file': writeFile
};


// Tool Declration and define instruction

const listFileTool = {
    name: "list_file",
    description: "get all javascript file in a directory",
    parameters:{
        type: Type.OBJECT,
        properties:{
            directory:{
                type:Type.STRING,
                description: "Directory path to scan"
            }
        },
        required: ["directory"],
    }
};

const readFileTool = {
    name: "read_file",
    description: "read a file content",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "path to the file"
            }
        },
        required: ["filePath"]
    }
};

const writeFileTool = {
    name: "write_file",
    description: "write fixed content back to a file",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "Path to the file to write"
            },
            content: {
                type: Type.STRING,
                description: "The fixed/corrected content"
            }
        },
        required: ["filePath", "content"]
    }
};

// create history array which store the user querry and model response
const History = []

export async function runagent(directoryPath) {
    console.log(`🔍 Reviewing: ${directoryPath}\n`);

    History.push(
        { 
            role: "user",
             parts: [ 
                { 
                    text: `Review and fix all code issues inside directory: ${directoryPath}`, 
                }, 
            ], 
        }
    );

    while (true) {
        const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: History,
        config: {
            systemInstruction: `You are an expert JavaScript code reviewer and fixer.

            **Your Job:**
            1. Use list_files to get all HTML, CSS, JavaScript, and TypeScript files in the directory
            2. Use read_file to read each file\'s content
            3. Analyze for:
            
            **HTML Issues:**
            - Missing doctype, meta tags, semantic HTML
            - Broken links, missing alt attributes
            - Accessibility issues (ARIA, roles)
            - Inline styles that should be in CSS
            
            **CSS Issues:**
            - Syntax errors, invalid properties
            - Browser compatibility issues
            - Inefficient selectors
            - Missing vendor prefixes
            - Unused or duplicate styles
            
            **JavaScript Issues:**
            - BUGS: null/undefined errors, missing returns, type issues, async problems
            - SECURITY: hardcoded secrets, eval(), XSS risks, injection vulnerabilities
            - CODE QUALITY: console.logs, unused code, bad naming, complex logic

            4. Use write_file to FIX the issues you found (write corrected code back)
            5. After fixing all files, respond with a summary report in TEXT format

            **Summary Report Format:**
            📊 CODE REVIEW COMPLETE

            Total Files Analyzed: X
            Files Fixed: Y

            🔴 SECURITY FIXES:
            - file.js:line - Fixed hardcoded API key
            - auth.js:line - Removed eval() usage

            🟠 BUG FIXES:
            - app.js:line - Added null check for user object
            - index.html:line - Added missing alt attribute

            🟡 CODE QUALITY IMPROVEMENTS:
            - styles.css:line - Removed duplicate styles
            - script.js:line - Removed console.log statements

            Be practical and focus on real issues. Actually FIX the code, don\'t just report.`,
            tools: [ 
                { 
                    functionDeclarations: [ 
                        listFileTool, 
                        readFileTool, 
                        writeFileTool, 
                    ], 
                }, 
            ], 
        }, 
    });
    
        // const functionCalls = result.candidates?.[0]?.content?.parts?.filter( (p) => p.functionCall ) || [];
    if(result.functionCalls?.length>0){
            
        for(const functionCall of result.functionCalls){
            const { name, args } = functionCall;

            const toolResponse = await tools[name](args);

            History.push({
                role:'model',
                parts:[{functionCall}]
            })

            History.push({
                role:'user',
                parts:[{
                    functionResponse:{
                        name,
                        response:{result: toolResponse}
                    }}]
            })
        }
    }else{
        console.log('\n'+ result.text)
        break
    }

}
}

const directory = process.argv[2] || '.';

await runagent(directory)