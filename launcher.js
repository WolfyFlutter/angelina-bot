import { fork } from 'node:child_process';

let run = function () {
    return new Promise((resolve, reject) => {
        const child = fork('./index.js', [], {
            execArgv: ['--expose-gc']
        });


        child.on('message', (message) => {
            if (message.type === 'uptime') {
                child.send({
                    type: 'uptime',
                    data: {
                        ...message.data,
                        uptime: process.uptime()
                    }
                })
            }

        })

        child.on('exit', (code) => {
            if (code === 1000) {
                resolve('restart')
            }
        })

        child.on('error', (error) => {
            console.log(error)
            resolve('restart')
        })
    })
}

let flag  = 'restart'

while (flag === 'restart') {
    flag = await run()
}