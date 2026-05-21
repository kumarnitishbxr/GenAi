import {GoogleGenAI, Type} from '@google/genai'
import 'dotenv/config'
import readlinesynce from 'readline-sync'
import os from 'os'

import { exec } from 'child_process'
import util from 'util'
const platform = os.platform();


const excute = util.promisify(exec)

const ai = new GoogleGenAI({});

// tool
async function excuteCommand({command}) {
    
    try{
        const { stdout, stderr } = await excute(command)

        if(stderr){
            return `Error: ${stderr}`
        }

        return `Success: ${stdout}`
    }
    catch(err){
        return `Erroor: ${err}`
    }
}

const excutecommandTool = {
    name:"excuteCommand",
    description:"it will take any shell/terminal command and excute it. it will help us to create, write, update, delete, read any folder and file ",
    parameters:{
        type: Type.OBJECT,
        properties:{
            command:{
                type: Type.STRING,
                description:"it is the terminal/shell command. eg. makdir calculator, touch calculator/index.html etc"
            }
        },
        required: ['command'],
    },
}

const history = []

async function runcommand() {

    while(true){
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: history,
            config: {
                systemInstruction: `You are a website Builder, which will create the frontend part of the website using terminal/shell Command.
                    You will give shell/terminal command one by one and our tool will execute it.

                    Give the command according to the Operarting system we are using.
                    My Current user Operating system is: ${platform}.

                    Kindly use best practice for commands, it should handle multine write also efficiently.

                    Your Job
                    1: Analyse the user query
                    2: Take the neccessary action after analysing the query by giving proper shell.command according to the user operating system.

                    Step By Step By Guide

                    1: First you have to create the folder for the website which we have to create, ex: mkdir calculator
                    2: Give shell/terminal command to create html file , ex: touch calculator/index.html
                    3: Give shell/terminal command to create CSS file 
                    4: Give shell/terminal command to create Javascript file 
                    5: Give shell/terminal command to write on html file 
                    6: Give shell/terminal command to write on css file 
                    7: Give shell/terminal command to write on javascript file
                    8: fix the error if they are persent at any step by writing, update or deleting`,
                tools: [
                    {
                        functionDeclarations: [excutecommandTool],
                    },
                ]
            },
        });
    

        if(result.functionCalls && result.functionCalls.length>0){
            const functioncall = result.functionCalls[0]

            const {name, args} = functioncall

            const toolresponse = await excuteCommand(args)

            const functionResponsePart = {
                name: functioncall.name,
                response: {
                    result: toolresponse,
                },
            };

            history.push({
                role:'model',
                parts:[{
                    functionCall: functioncall
                }]
            })

            history.push({
                role:'user',
                parts:[{
                    functionResponse: functionResponsePart
                }]
            })

            return await runcommand()
        }

        if (result.text) {

            console.log("\nAI:", result.text);

            history.push({
                role: "model",
                parts: [
                    {
                        text: result.text,
                    },
                ],
            });

            return;
        }
    }
}

while(true){
    const question = readlinesynce.question("ask anyhting to build:-> ");

    if(question.toLowerCase()==="exit"){
        break;
    }

    history.push({
        role:"user",
        parts:[
            {
                text: question
            }
        ]
    });

    await runcommand()
}



