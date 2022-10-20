'use strict';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mariadb from 'mariadb';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import url from 'url';
import result from './public/module/result.mjs';
const app = express();
dotenv.config();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**************************
 * Creating mariadb pool. *
 * ************************/
const pool = mariadb.createPool({
	host: process.env.MDB_HOST,
	user: process.env.MDB_USER,
	password: process.env.MDB_PASS,
	database: process.env.MDB_DB,
	connectionLimit: 5,
});


/**********************************************
 * Configure file storage for uploaded files. *
 **********************************************/
let fileName = '';
const fileStorage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './public/img/upload');
	},
	filename: function(req, file, callback) {
		let extension='';
		if(file.mimetype==='image/jpg') extension = '.jpg';
		else if(file.mimetype==='image/jpeg') extension='.jpg';
		else if(file.mimetype==='image/png') extension='.png';
		else if(file.mimetype==='image/tif') extension='.tif';
		callback(null, fileName+extension);
	}
});
const fileFilter = (req, file, callback) => {
	if (['image/png', 'image/jpg', 'image/jpeg', 'image/tif'].includes(file.mimetype)) {
		callback (null, true);
	} else {
		callback (null, false);
	}
}
const upload = multer({storage: fileStorage, fileFilter: fileFilter});//.single('uploadFile');


/***********************************
 * Configuration for static files. *
 ***********************************/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/*************************
 * Creating http server. *
 *************************/
app.get('/', (req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	if(filestat !== undefined && filestat.isFile()) {
		res.sendFile(indexPath);
	} else {
		res.statusCode=404;
		res.send("<h1>Page not found.</h1>");
	}
});



app.post('/save', async(req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	const {id, srno, desc, qnty, price, date, uploadFile} = req.body;

	if(filestat !== undefined && filestat.isFile()) {
		let conn;

		try {
			conn = await pool.getConnection();
			const test = await conn.query('SELECT COUNT(*) AS length FROM YuvanGarments');

			let tid;
			if(test[0] !== undefined) {
				tid = id;
			} else {
				tid = 1;
			}

			if(tid !== '' && date !== '')
				await conn.query('INSERT INTO YuvanGarments(pid, srno, description, qnty, prperqty, entryDate) values(?, ?, ?, ?, ?, ?)', [tid, srno, desc, qnty, price, date]);
			else if(tid !== '' && date === '')
				await conn.query('INSERT INTO YuvanGarments(pid, srno, description, qnty, prperqty) values(?, ?, ?, ?, ?)', [tid, srno, desc, qnty, price]);
			else if(tid === '' && date !== '')
				await conn.query('INSERT INTO YuvanGarments(srno, description, qnty, prperqty, entryDate) values(?, ?, ?, ?, ?)', [srno, desc, qnty, price, date]);
			else
				await conn.query('INSERT INTO YuvanGarments(srno, description, qnty, prperqty) values(?, ?, ?, ?)', [srno, desc, qnty, price]);

			/*
			 * Defining filename for uploaded photo.
			 */
			const cur_rec = await conn.query('SELECT pid FROM YuvanGarments WHERE cur_rec = (SELECT MAX(cur_rec) FROM YuvanGarments)');
			fileName = cur_rec[0].pid;

			fs.readFile(indexPath, 'utf8', (err, data) => {
				if(err) console.log(err);

				const $ = cheerio.load(data);
				$('#saveStats').text("Successfully saved into database");
				$('#saveStats').attr('style', 'color: #500571');


				const uploadbtn = `
					<label style="color: #7D2A72;">Upload image for saved data &nbsp;&nbsp;&nbsp;</label>
					<input type="file" name="uploadFile">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
					<input type="submit" class="btn" value="upload">
					`;
				$('#uploadForm').append(uploadbtn);


				data = $.html();
				res.send(data);
			});
		}
		catch(err) {
			if(err) console.log(err);
			fs.readFile(indexPath, 'utf8', (err, data) => {
				if(err) console.log(err);

				const $ = cheerio.load(data);
				$('#id').attr('value', id);
				$('#srno').attr('value', srno);
				$('#desc').attr('value', desc);
				$('#qnty').attr('value', qnty);
				$('#price').attr('value', price);
				$('#saveStats').text("Unable to save. Duplicate ID.");
				$('#saveStats').attr('style', 'color: red');
				data = $.html();
				res.send(data);
			});
		}
		finally {
			if(conn) conn.end();
		}

	} else {
		res.statusCode=404;
		res.send("<h1>Page not found.</h1>");
	}
});


app.post('/upload', upload.single('uploadFile'), (req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	if(filestat !== undefined && filestat.isFile()) {
		fs.readFile(indexPath, 'utf8', (err, data) => {
			if(err) console.log(err);

			const $ = cheerio.load(data);

			$('#uploadForm').append('<h3 id="uploadStats">File uploaded successfully</h3>');
			$('#uploadstats').attr('style', 'color: #7D2A72;');


			data = $.html();
			res.send(data);
		});
	}
});


app.post('/search', async(req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	const {searchType, id, dateFrom, dateTo, cdate, description} = req.body;
	let qry;

	if(filestat !== undefined && filestat.isFile()) {

		let conn;
		try {
			conn = await pool.getConnection();

			const length = await conn.query('SELECT COUNT(*) as length FROM YuvanGarments');
			if(parseInt(length[0].length) > 0) {

				if(searchType === undefined) {
					qry = await conn.query('SELECT * FROM YuvanGarments ORDER BY pid');
				} else if(searchType === 'id') {
					if(id === '')
						qry = '';
					else
						qry = await conn.query('SELECT * FROM YuvanGarments WHERE pid=?', [id]);
				} else if(searchType === 'description') {
					if(description === '')
						qry = '';
					else
						qry = await conn.query('SELECT * FROM YuvanGarments WHERE description like ?', ['%'+description+'%']);
				} else if(searchType === 'date') {
					if(cdate === '' && dateFrom === '' && dateTo === '')
						qry = '';
					else if(cdate !== '')
						qry = await conn.query('SELECT * FROM YuvanGarments WHERE entryDate = ?', [cdate]);
					else if(dateFrom !== '' && dateTo !== '')
						qry = await conn.query('SELECT * FROM YuvanGarments WHERE entryDate BETWEEN ? AND ?', [dateFrom, dateTo]);
				}
				result(qry, indexPath, res);

			} else {
				qry = '';
				result(qry, indexPath, res);
			}

		} catch(err) {
			if(err) console.log(err);
		} finally {
			if(conn) conn.end();
		}
		
	} else {
		res.statusCode=404;
		res.send("<h1>Page not found.</h1>");
	}
});


app.post('/preUpdate', async(req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	const { id } = req.body;

	if(filestat !== undefined && filestat.isFile()) {

		let conn;

		try {
			conn = await pool.getConnection();

			const updateData = await conn.query('SELECT * FROM YuvanGarments WHERE pid = ?', [id]);

			fs.readFile(indexPath, 'utf8', (err, data) => {
				if(err) console.log(err);

				const $ = cheerio.load(data);

				if(id === '') {
					$('#pid').attr('placeholder', 'ID required for update database');
					$('#pid').attr('style', 'color: red;');
				} else if(updateData[0] === undefined) {
					$('#pid').attr('placeholder', 'This ID didn\'t exist in your database.');
					$('#pid').attr('style', 'color: red;');
				} else {

					/****************************************************
					 * Set image file name and find the image with type *
					 ****************************************************/
					fileName = id;

					const imgPath = path.join(__dirname, 'public/img/upload');
					const fileInf = getFile(imgPath, id);

					let imgFile = '#';
					if(fileInf.file !== '')
						imgFile = path.join('img/upload', fileInf.file);
					//console.log("file in preupdate", imgFile);


					/*
					 * Convert UTC date to local date
					 */
					let dbDate = new Date(updateData[0].entryDate).toLocaleString();
					dbDate = dbDate.split(',')[0];

					const form=`
						<form action="/update" method="post">
							<input type="hidden" name="hidPid" value="${updateData[0].pid}">
							<table>
								<tr>
								<th width="10%">ID</th>
								<th width="15%">Serial Number</th>
								<th width="20%">Description</th>
								<th width="10%">Quantity</th>
								<th width="10%">Price</th>
								<th width="20%">Entry Date</th>
								<th width="15%">Image</th>
								</tr>
							<thead>
							</thead>
							<tbody>
								<tr>
									<td> <input type="text" name="id" value="${ updateData[0].pid }"> </td>
									<td> <input type="text" name="srno" value="${ updateData[0].srno }"> </td>
									<td> <input type="text" name="desc" value="${ updateData[0].description }"> </td>
									<td> <input type="text" name="qnty" value="${ updateData[0].qnty }"> </td>
									<td> <input type="text" name="price" value="${ updateData[0].prperqty }"> </td>
									<td>
										<label style="padding: 10px 0px 3px 0px;">${ dbDate }</label>
										<input type="date" name="date">
									</td>
									<td>
										<img src="${imgFile}" width="16" height="16">
										&nbsp;&nbsp;&nbsp;&nbsp;<input type="submit" class="btn" value="Save">
									</td>
								</tr>
							</tbody>
							</table>
						</form>
						<form action="/updateimg" method="post" enctype="multipart/form-data">
							<label style="color: #8F3A84; font-size: 18px">Upload an image for update</lable>
							&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="file" name="updateImage" required>
							&nbsp;&nbsp;&nbsp;&nbsp;<input type="submit" class="btn" value="Upload">
						</form>
						`;
					
					$('.saveDB').append(form);
				}

				data = $.html();
				res.send(data);
			});
		} catch(err) {
			if(err) console.log(err);
			res.redirect('/');
		} finally {
			if(conn) conn.end();
		}
	}
});



app.post('/update', async(req, res) => {
	const indexPath = path.join(__dirname, 'public', 'index.html');
	const filePath = path.join(__dirname, 'public/img/upload');

	let filestat, oldFile, newFile;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	const { hidPid, id, srno, desc, qnty, price, date } = req.body;

	if(filestat !== undefined && filestat.isFile()) {
		let flag;
		let conn;

		try {
			conn = await pool.getConnection();

			if(id === '' || srno === '' || desc === '' || qnty === '' || price === '') {
				flag = false;
			} else {
				flag = true;
				if(date === '')
					await conn.query('UPDATE YuvanGarments SET pid=?, srno=?, description=?, qnty=?, prperqty=? WHERE pid=?', [id, srno, desc, qnty, price, hidPid]);
				else
					await conn.query('UPDATE YuvanGarments SET pid=?, srno=?, description=?, qnty=?, prperqty=?, entryDate=? WHERE pid=?', [id, srno, desc, qnty, price, date, hidPid]);


				/*
				 * Changing image file name.
				 */
				if(hidPid !== id) {
					const fileExist = getFile(filePath, hidPid);
					if(fileExist.file === '') {
						console.log("File didn't exist.");
					} else {
						oldFile = `${filePath}/${fileExist.file}`;
						newFile = `${filePath}/${id}${fileExist.extension}`;
						fs.rename(oldFile, newFile, (err) => {
							if(err) {
								console.log(err);
								return;
							}
							console.log("File renamed successfully.");
						});
						console.log(oldFile, newFile);
					}
				}
			}

			fs.readFile(indexPath, 'utf8', (err, data) => {
				if(err) console.log(err);

				const $ = cheerio.load(data);

				if(!flag) {
					$('.saveDB').append('<h3 id="error">Don\'t leave any field blank. Just update the required field.</h3>');
					$('#error').attr('style', 'color: red;');
				} else {
					$('.saveDB').append('<h3 id="success">Database updated successfully.</h3>');
					$('#success').attr('style', 'color: #500571;');
				}

				data = $.html();
				res.send(data);
			});

		} catch(err) {
			if(err) console.log(err);
			fs.readFile(indexPath, 'utf8', (err, data) => {
				if(err) console.log(err);

				const $ = cheerio.load(data);

				$('.saveDB').append('<h3 id="error">Invalid date format.</h3>');
				$('#error').attr('style', 'color: red;');

				data = $.html();
				res.send(data);
			});
		} finally {
			if(conn) conn.end();
		}
	}
});



app.post('/updateimg', upload.single('updateImage'), (req, res) => {
	const indexPath=path.join(__dirname, 'public', 'index.html');

	let filestat;
	try { filestat=fs.statSync(indexPath); } catch(e){}

	if(filestat !== undefined && filestat.isFile()) {
		fs.readFile(indexPath, 'utf8', (err, data) => {
			if(err) console.log(err);

			const $ = cheerio.load(data);

			$('.saveDB').append('<h3 id="success">Image updated successfully.</h3>');
			$('#success').attr('style', 'color: #500571;');


			data = $.html();
			res.send(data);
		});
	}
});



function getFile(filePath, fileName) {

	let isfind=false, file='', filestat, extension='';
	const fileSource = path.join(filePath, fileName);

	if(!isfind){
		try { filestat = fs.statSync(fileSource+'.jpg'); } catch(e){}
		if(filestat !== undefined && filestat.isFile()) {
			isfind = true;
			file = `${fileName}.jpg`
			extension = '.jpg';
		}
	}

	if(!isfind)	 {
		try { filestat=fs.statSync(fileSource+'.png'); } catch(e){}
		if(filestat !== undefined && filestat.isFile()) {
			isfind = true;
			file = `${fileName}.png`
			extension = '.png';
		}
	}

	if(!isfind) {
		try { filestat = fs.statSync(fileSource+'.tif'); } catch(e){}
		if(filestat !== undefined && filestat.isFile()) {
			isfind = true;
			file = `${fileName}.tif`
			extension = '.tif';
		}
	}

	return {file: file, extension: extension };
}


const port = 8000;
app.listen(port, () => {
	console.log("Server listening at port:", port);
});
