import { fork } from 'node:child_process';

let a = async function () {
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
                console.log('ada exit', code)
                if (code === 69) {
                    resolve('restart')
                }else{
                    resolve('exit')
                }
            })

            child.on('error', (error) => {
                console.log('ada error', error)
                resolve('restart')
            })
        })
    }

    let flag = 'restart'

    while (flag === 'restart') {
        flag = await run()
    }
}

a()