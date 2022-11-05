import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function result(qry, indexPath, res) {
	fs.readFile(indexPath, 'utf8', (err, data) => {
		if(err) console.log(err);

		const $ = cheerio.load(data);

		if(qry !== '') {

			let filestat=[], file, isfind;

			let sum = 0.0;
			let dataRow = '';
			const len = qry.length;

			for(let i=0; i<len; i++) {
				
				isfind = false;
				file = '#';
				const filepath = path.join(__dirname, '../img/upload', `${qry[i].pid}`);

				if(!isfind){
					try { filestat[qry[i].pid]=fs.statSync(filepath+'.jpg'); } catch(e){}
					if(filestat[qry[i].pid] !== undefined && filestat[qry[i].pid].isFile()) {
						isfind = true;
						file = `../img/upload/${qry[i].pid}.jpg`
					}
				}

				if(!isfind)	 {
					try { filestat[qry[i].pid]=fs.statSync(filepath+'.png'); } catch(e){}
					if(filestat[qry[i].pid] !== undefined && filestat[qry[i].pid].isFile()) {
						isfind = true;
						file = `../img/upload/${qry[i].pid}.png`
					}
				}

				if(!isfind) {
					try { filestat[qry[i].pid]=fs.statSync(filepath+'.tif'); } catch(e){}
					if(filestat[qry[i].pid] !== undefined && filestat[qry[i].pid].isFile()) {
						isfind = true;
						file = `../img/upload/${qry[i].pid}.png`
					}
				}


				sum = sum + parseFloat(qry[i].subtotal);
				let dbDate = new Date(qry[i].entryDate).toLocaleString();
				dbDate = dbDate.split(',')[0];
				dataRow += `
					<tr>
						<td>${ qry[i].pid }</td>
						<td>${ qry[i].srno}</td>
						<td>${ qry[i].description }</td>
						<td>${ qry[i].qnty }</td>
						<td>&#8377;&nbsp;${ qry[i].prperqty }</td>
						<td>&#8377;&nbsp;${ qry[i].subtotal}</td>
						<td>${ dbDate }</td>
						<td><img src="${file}" id="uploadedImg" width="16px" height="16px"></td>
					</tr>
					`;
			}

			const table = `
				<table id="resultData" class="resultData">
					<thead>
						<tr>
							<th width="10%">ID</th>
							<th width="10%">Serial Number</th>
							<th width="20%">Description</th>
							<th width="10%">Quantity</th>
							<th width="15%">Price / QTY</th>
							<th width="15%">Total</th>
							<th width="15%">Entry Date</th>
							<th width="5%">Image</th>
						</tr>
					</thead>
					<tbody>
						${ dataRow }
					</tbody>
				</table>
				`;
			$('#searchResult').append(table);
			$('#sum').append(`<h3 class="total">Total price: &#8377;&nbsp;${ sum }</h3>`);
			$('#sum').append('<button type="button" id="printbtn" class="btn" onclick="printResult()">Print result</button>');

		} else {
			const ptag = `<p style="color: red; font-size: 20px; text-align: center;">0 record found</p>`;
			$('#searchResult').append(ptag);
			$('#searchResult').attr('style', 'width: 100%; background: #E7B4E1;');
		}

		data = $.html();
		res.send(data);
	});
}


export default result;

