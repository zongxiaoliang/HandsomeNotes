/*
 * @Author: zongxiaoliang 996456708@qq.com
 * @Date: 2023-09-05 08:39:26
 * @LastEditors: zongxiaoliang 996456708@qq.com
 * @LastEditTime: 2023-09-05 11:17:22
 * @FilePath: \node-demo\index.js
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */
const fs = require('fs');

const rs = fs.createReadStream('./text.txt');
const ws = fs.createWriteStream('./text-1.txt');

rs.on('data',chunk=>{
	ws.write(chunk);
});