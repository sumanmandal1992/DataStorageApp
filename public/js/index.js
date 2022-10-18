function showType() {
	const selectTag = document.getElementById('searchType');
	const selectRow = document.getElementById('selectRow');
	const searchBtnRow = document.getElementById('searchBtnRow');	
	const cellen = selectRow.cells.length;
	console.log(selectTag.value, cellen);

	if(selectTag.value === 'id') {
		if(cellen>1) {
			let td = document.getElementById('tdchild');
			selectRow.removeChild(td);
		}
		let td = document.createElement('td');
		td.setAttribute('id', 'tdchild');
		selectRow.appendChild(td);

		let cell = document.getElementById('tdchild');
		let input = document.createElement('input');
		input.type = 'text';
		input.name='id';
		cell.appendChild(input);

	} else if (selectTag.value === 'date') {
		if(cellen>1) {
			let td = document.getElementById('tdchild');
			selectRow.removeChild(td);
		}
		let td = document.createElement('td');
		td.setAttribute('id', 'tdchild');
		selectRow.appendChild(td);

		let cell = document.getElementById('tdchild');
		let from = document.createTextNode('From');
		let to = document.createTextNode('To');
		let input = document.createElement('input');

		input.type = 'date';
		input.name = 'dateFrom';
		cell.appendChild(from);
		cell.innerHTML += '&nbsp;';
		cell.appendChild(input);
		cell.innerHTML += '&nbsp;&nbsp;&nbsp;';
		input = document.createElement('input');
		input.type = 'date';
		input.name = 'dateTo';
		cell.appendChild(to);
		cell.innerHTML += '&nbsp;';
		cell.appendChild(input);

		cell.appendChild(document.createElement('br'));
		cell.appendChild(document.createElement('br'));
		input = document.createElement('input');
		input.type = 'date';
		input.name = 'cdate';
		cell.appendChild(document.createTextNode('Date'));
		cell.innerHTML += '&nbsp;';
		cell.appendChild(input);

	} else if (selectTag.value === 'description') {
		if(cellen>1) {
			let td = document.getElementById('tdchild');
			selectRow.removeChild(td);
		}
		let td = document.createElement('td');
		td.setAttribute('id', 'tdchild');
		selectRow.appendChild(td);

		let cell = document.getElementById('tdchild');
		let input = document.createElement('input');
		input.type = 'text';
		input.name='description';
		cell.appendChild(input);
	}
}
