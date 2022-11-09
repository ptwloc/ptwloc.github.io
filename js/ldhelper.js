
			const searchElement1 = document.querySelector('#s_search1');
			const searchElement2 = document.querySelector('#s_search2');
			const searchElement3 = document.querySelector('#s_search3');
			const language_select = document.querySelector('#language_select'); 
			var excel_json_data;
			var selectedLanguage = "Language Not Selected";
			const modal = document.getElementById("help_modal");
			const span = document.getElementsByClassName("close")[0];
			var isCheckMode = false;
			var codeIntegrityCheckResults = {};
			var dropArea = document.getElementById("drop-area")
			
			const rowsPerPage = 500;
			var allRows = [];
			var pagination = 1;
			var maxPagination = 1;

			const comments_not_present_in_trs = "is found in Source Language Text but not present in Translation Text.";
			const comments_not_present_in_src = "is found in Translation Text but not present in Source Language Text.";
			const comments_unmatching_code = "Unmatching Code Brackets Detected";
			const comments_no_issue_found = "No issues found. Please make sure that you have selected corresponding code brackets for this project. Also make sure if the code brackets are in the correct order within the text.";
			const round_flag_red = "round-flag-red";
			const round_flag_orange = "round-flag-orange";
			const round_flag_green = "round-flag-green";
				
			const angle_regex = '<.*?>';
			const square_regex = '\\[\\[.*?\\]\\]|\\[.*?\\]';
			const braces_regex = '\{\{.*?\}\}|\{.*?\}';
			var	regex = RegExp(square_regex + "|" + angle_regex + "|" + braces_regex, 'g');
			var rowCount = 0;
			const translationStatusGreen = 3;

			// Prevent default drag behaviors
			;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
				dropArea.addEventListener(eventName, preventDefaults, false)   
				document.body.addEventListener(eventName, preventDefaults, false)
			})
			
			// Highlight drop area when item is dragged over it
			;['dragenter', 'dragover'].forEach(eventName => {
				dropArea.addEventListener(eventName, highlight, false)
			})
			
			;['dragleave', 'drop'].forEach(eventName => {
				dropArea.addEventListener(eventName, unhighlight, false)
			})
			
			// Handle dropped files
			dropArea.addEventListener('drop', handleDrop, false)
			
			function preventDefaults (e) {
				e.preventDefault()
				e.stopPropagation()
			}
			
			function highlight(e) {
				dropArea.classList.add('highlight')
			}
			
			function unhighlight(e) {
				dropArea.classList.remove('active')
			}
			
			function handleDrop(e) {
				var dt = e.dataTransfer
				var files = dt.files
				submitFileForm(files);
			}
			
			let uploadProgress = []
			let progressBar = document.getElementById('progress-bar')
			
			function initializeProgress(numFiles) {
				progressBar.value = 0
				uploadProgress = []
			
				for(let i = numFiles; i > 0; i--) {
				uploadProgress.push(0)
				}
			}
			
			function updateProgress(fileNumber, percent) {
				uploadProgress[fileNumber] = percent
				let total = uploadProgress.reduce((tot, curr) => tot + curr, 0) / uploadProgress.length
				progressBar.value = total
			}
			
			function previewFile(file) {
				let reader = new FileReader()
				reader.readAsDataURL(file)
				reader.onloadend = function() {
				let img = document.createElement('img')
				img.src = reader.result
				document.getElementById('gallery').appendChild(img)
				}
			}
			
			function returnToSearch() {
				document.getElementById("search_button").hidden = true;
				document.getElementById("check_button").hidden = false;
				isCheckMode = false;
				document.getElementById("search_row").hidden = false;
				document.getElementById("bot_comments").hidden = true;
				document.getElementById("code_selector").style.display = "none";
				document.getElementById("s_to_check").style.display = "none";
				searchForConsistency();
			}
			
			function onCheckBrackets(element) {
				let angle = document.getElementById("angle_brackets_checkbox");
				let square = document.getElementById("square_brackets_checkbox");
				let braces = document.getElementById("braces_checkbox");
				
				if(angle.checked && square.checked && braces.checked) {
					regex = RegExp(square_regex + "|" + angle_regex + "|" + braces_regex, 'g');
				} else if(angle.checked && square.checked) {
					regex = RegExp(square_regex + "|" + angle_regex, 'g');
				} else if(angle.checked && braces.checked) {
					regex = RegExp(angle_regex + "|" + braces_regex, 'g');
				} else if(square.checked && braces.checked) {
					regex = RegExp(square_regex + "|" + braces_regex, 'g');
				} else if(angle.checked) {
					regex = RegExp(angle_regex, 'g');
				} else if(square.checked) {
					regex = RegExp(square_regex, 'g');
				} else if(braces.checked) {
					regex = RegExp(braces_regex, 'g');
				} else {
					regex = RegExp("^Search_Disabled&", 'g');
				}
				
				getCodeIntegrityCheckResults();
				checkString();
			}

			function onClickHelp() {
			  modal.style.display = "block";
			}

			span.onclick = function() {
			  modal.style.display = "none";
			}

			window.onclick = function(event) {
			  if (event.target == modal) {
				modal.style.display = "none";
			  }
			}
		
			document.addEventListener('keydown', 
			(event)=> {    
			  if( event.key === "Escape" ) {
				var text = document.getElementById("s_to_clean");
				var text2 = document.getElementById("s_cleaned");
				var text3 = document.getElementById("s_search1");
				var text4 = document.getElementById("s_search2");
				var text5 = document.getElementById("s_search3");
				var text6 = document.getElementById("s_to_check_source");
				var text7 = document.getElementById("s_to_check_translation");
				var text8 = document.getElementById("s_to_check_comments");
				text.value = "";
				text2.value = "";
				text3.value = "";
				text4.value = "";
				text5.value = "";
				text6.value = "";
				text7.value = "";
				text8.value = "";
				setCommentsFlagColor("");
				
				document.getElementById("copied_string_id").innerText = "";
				
				if(!isCheckMode) {
					removeAllRows();
				}
			  } else if( event.key === "Enter" ) {
				if(document.activeElement === searchElement1 || document.activeElement === searchElement2 || document.activeElement === searchElement3) {
					searchForConsistency();
				}
			  }
			});
			
			function toast() {
			  var x = document.getElementById("snackbar");
			  x.className = "show";
			  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
			}
			
			function cleanString() {
			  var x = document.getElementById("s_to_clean");
			  var s = x.value;
			  
			  if(s.startsWith('"') && s.endsWith('"')) {
				s = s.slice(1, -1);
			  }
			  
			  s = s.replaceAll(/""/g, '"');
			  
			  if(s!==null) {
				document.getElementById("s_cleaned").value = s;
			  }
			}
			
			function copyToClipboard(value) {
				var text = value;
				if (window.clipboardData && window.clipboardData.setData) {
					// Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
					toast();
					return window.clipboardData.setData("Text", text);

				}
				else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
					var textarea = document.createElement("textarea");
					textarea.textContent = text;
					textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
					document.body.appendChild(textarea);
					textarea.select();
					try {
						document.execCommand("copy");  // Security exception may be thrown by some browsers.
						toast();
						return;
					}
					catch (ex) {
						console.warn("Copy to clipboard failed.", ex);
						return prompt("Copy to clipboard: Ctrl+C, Enter", text);
					}
					finally {
						document.body.removeChild(textarea);
					}
				}
			}
			
			function scrollToTop() {
				var position =
					document.body.scrollTop || document.documentElement.scrollTop;
				if (position) {
					window.scrollBy(0, -Math.max(1, Math.floor(position / 10)));
					scrollAnimation = setTimeout("scrollToTop()", 10);
				} else clearTimeout(scrollAnimation);
			}

			function scrollToDiv(id) {
				var element = document.getElementById(id);
				var position = element.getBoundingClientRect();
				var y = position.top;

				document.getElementById(id).className = "fade-it";
				setTimeout(() => {
					document.getElementById(id).className = "";
				}, 1100);

				window.scrollTo(0, y-60);
			}
			
			function copyToClipboardAndStringChecker(element) {
				try {
					document.getElementById("s_to_check_source").value = element.children.item(1).innerText;
					document.getElementById("s_to_check_translation").value = element.children.item(2).innerText;
					checkString();
					document.getElementById("copied_string_id").innerHTML = `<span style="cursor: pointer;" onMouseOver="this.style.color='black'" onMouseOut="this.style.color='grey'" onclick="copyToClipboard(this.innerText)">${element.children.item(0).children.item(0).innerText}</span>` +
																			`<a style="margin-left: 1rem; cursor: pointer; color: blue; text-decoration: underline; text-decoration-color: blue;" onclick="scrollToDiv('${element.children.item(0).children.item(0).innerText}')">Go back to Table</a>`;
					scrollToTop();
					copyToClipboard(element.children.item(0).children.item(0).innerText);
				} catch(e) {
				}
			}

			function escapeHtml(html) {
				return html
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#039;");
			}
			
			function addRow(stringId, sourceLanguageText, translationText, translationStatus, errorMessageArray = []) {
			    var table = document.querySelector("#result_table>tbody");
				var row = table.insertRow(0);
				var cell1 = row.insertCell(0);
				var cell2 = row.insertCell(1);
				var cell3 = row.insertCell(2);
				if(isCheckMode) {
				  cell1.parentNode.id = stringId;
				  cell1.innerHTML = `<span onclick="copyToClipboardAndStringChecker(this.parentNode.parentNode)" class="clickable_cell">` + stringId + "</span>";
				} else {
				  cell1.innerHTML = `<span onclick="copyToClipboard(this.innerHTML)" class="clickable_cell">` + stringId + "</span>";
				}
				cell2.innerText = sourceLanguageText;
				cell3.innerText = translationText;
				
				if(errorMessageArray && errorMessageArray.length > 0) {
				  var cell4 = row.insertCell(3);
				  
				  let text = "";
				  
				  for(let i=0; i<errorMessageArray.length; i++) {
					  if(errorMessageArray[i]["language"] == selectedLanguage + " text") {
						  let defect = escapeHtml(errorMessageArray[i].defect);
						  let note = errorMessageArray[i].type == 3 ? 
							(errorMessageArray[i].note ? "<br>Source Language Text:<br>" + escapeHtml(errorMessageArray[i].note) + "<br>" : "") +
							(errorMessageArray[i].note2 ? "<br>Translation Text:<br>" + escapeHtml(errorMessageArray[i].note2) : "") :
							errorMessageArray[i].note;
						  text += `${defect}`
						  text += `<br><span style='color: grey; font-weight: bold; font-size: 0.9rem;'>${note}</span><br><br>`;
					  }
				  }
				  
				  cell4.innerHTML = text;
				}
			}

			function removeAllRows() {
				var table = document.querySelector("#result_table>tbody");
				table.innerHTML = "";
				rowCount = 0;
				document.getElementById("row_count").innerText = rowCount;
				allRows = [];
				pagination = 1;
				maxPagination = 1;
			}

			function nextPage() {
				if(pagination < maxPagination) {
					var table = document.querySelector("#result_table>tbody");
					table.innerHTML = "";
					pagination = pagination + 1;
					displayRows();
				}
			}

			function prevPage() {
				if(pagination > 1) {
					var table = document.querySelector("#result_table>tbody");
					table.innerHTML = "";
					pagination = pagination - 1;
					displayRows();
				}
			}

			function firstOrLastPage() {
				if(pagination <= maxPagination/2) {
					var table = document.querySelector("#result_table>tbody");
					table.innerHTML = "";
					pagination = maxPagination;
					displayRows();
				} else {
					var table = document.querySelector("#result_table>tbody");
					table.innerHTML = "";
					pagination = 1;
					displayRows();
				}
			}

			function displayRows() {
				if(allRows[0] && allRows[0].trs_defect) {
					for(let i=(pagination-1)*rowsPerPage; i<pagination*rowsPerPage && i < allRows.length; i++) {
						let row = allRows[i];
						addRow(row.string_id, row.src_text, row.trs_text, row.trs_stat, row.trs_defect);
					}
				} else {
					for(let i=(pagination-1)*rowsPerPage; i<pagination*rowsPerPage && i < allRows.length; i++) {
						let row = allRows[i];
						addRow(row.string_id, row.src_text, row.trs_text, row.trs_stat);
					}
				}

				rowCount = 0;
				allRows.map(row => {
					rowCount = rowCount+1;
				});

				document.getElementById("pagination").innerHTML = pagination + "/" + maxPagination;
			}
			
			function searchForConsistency() {
			  var s1 = document.getElementById("s_search1").value;
			  var s2 = document.getElementById("s_search2").value;
			  var s3 = document.getElementById("s_search3").value;
			  
			  if(excel_json_data !== undefined) {
				  removeAllRows();
				  var string_ids = excel_json_data["String Identifier"];
				  
				  let rows = [];

				  if(string_ids !== null) {
					for(var i=string_ids.length-1; i>=0; i--) {
						if( (s1 ? excel_json_data["String Identifier"][i].toLowerCase().includes(s1.toLowerCase()) : true) &&
							(s2 ? excel_json_data["Source Language Text"][i].toLowerCase().includes(s2.toLowerCase()) : true) &&
							(s3 ? excel_json_data[selectedLanguage + " text"][i].toLowerCase().includes(s3.toLowerCase()) : true) &&
							(excel_json_data[selectedLanguage + " translationStatus"][i] == translationStatusGreen) ) {
							
							rows.push({
								string_id: excel_json_data["String Identifier"][i],
								src_text: excel_json_data["Source Language Text"][i],
								trs_text: excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "",
								trs_stat: excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : ""
							});
						}
					}
				  }

				  allRows = rows;
				  pagination = 1;
				  maxPagination = Math.ceil((allRows.length>0?allRows.length:1)/rowsPerPage);

				  displayRows();

				  document.getElementById("row_count").innerText = rowCount;
			  }
			}
			
			function switchLanguage() {
				var e = document.getElementById("language_select");
				var text = e.options[e.selectedIndex].text;
				selectedLanguage = text;
				
				if(isCheckMode) {
					displayCodeIntegrityCheckResults();
				} else {
					searchForConsistency();
				}
			}
			
			// This function assumes that any characters of Source Text and Translation Text inside <> OR {{}} OR {} OR [[]] OR [] must be identical
			// @params An object that contains arrays of string objects(source_array)
			// @returns An object that looks like {failed_strings: [], unidentified_strings: []}
			function runCodeIntegrityCheck(source_array) {
				// 1. DECLARE an empty array of string objects(result_array) and DECLARE an empty array of string objects(unidentified_array)
				let result_array = [];
				let unidentified_array = [];
				
				// 2. DECLARE an array with string objects(test_array) of any Source Text that INCLUDES '</' OR '{' OR '[' OR '/>' OR '}' OR ']' by LOOPING through source_array
				let test_array = [];
				
				if(!source_array["String Identifier"]) {
					return {failed_strings: [], unidentified_strings: []};
				}
				
				for(let i=0; i<source_array["String Identifier"].length; i++) {
					if(source_array["Source Language Text"][i] && (source_array["Source Language Text"][i].includes("<") || source_array["Source Language Text"][i].includes(">") || source_array["Source Language Text"][i].includes("{") || source_array["Source Language Text"][i].includes("}")
					|| source_array["Source Language Text"][i].includes("[") || source_array["Source Language Text"][i].includes("]"))) {
						let obj = {};

						for(let key in source_array) {
							obj[key] = source_array[key] ? source_array[key][i] : null;
						}

						test_array.push(obj);
					}
				}
				
				// 3. LOOP through the test_array
				for(let i=0; i<test_array.length; i++) {
				
					// TRY
					try {
						let codesplits = {};
					
						for (const key in test_array[i]) {
						
							// 3-1. Get Source Text from the string object
							let text = test_array[i][key];
						
							let matches = [];
							
							// 3-2. SUBSTRING text splits that MATCH a pattern of "<.*>" OR "\{\{.*\}\}" OR "\{.*\}" OR "\\[\\[.*\\]\\]" OR "\\[.*\\]"
							while (null !== (matchArr = regex.exec(text))) {
								matches.push(matchArr[0]);
							}
							
							// 3-3. PUSH an element to the array of strings(codesplits) with substringed splits for each string
							
							// MUST EDIT HERE ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !
							// IF the key is not String ID or Translation Status as we don't want those in codesplits array
							if(key.toLowerCase().includes("text")) { 
								codesplits[key] = matches;
							}
						}
						
						// An example of codesplits object: { French Text: [], Korean Text: ['{hello}'], ..., Source Language Text: ['{hello}', '<world>'] } 
						
						let defect_languages = [];
						
						// 3-4. Find out every translation text that has unmatching code splits and PUSH defect object to defect_languages
						
						// 3-4-1. LOOP through Source Language Text codesplits array to find any missing text in Translation Text codesplits arrays
						for(let j=0; j<codesplits["Source Language Text"].length; j++) {
							for (const key in codesplits) {
								// IF the translation text DOES NOT INCLUDE source language split
								if(test_array[i][key] && !codesplits[key].includes(codesplits["Source Language Text"][j])) {
									defect_languages.push({
										language: key,
										defect: codesplits["Source Language Text"][j],
										note: comments_not_present_in_trs,
										type: 1
									});
								}
							}
						}
						
						// 3-4-2. LOOP through Translation Text codesplits arrays to find any missing text in Source Text codesplits array
						for(const key in codesplits) {
							for(let j=0; j<codesplits[key].length; j++) {
								// IF source language text split array DOES NOT INCLUDE translation text split
								if(!codesplits["Source Language Text"].includes(codesplits[key][j])) {
									defect_languages.push({
										language: key,
										defect: codesplits[key][j],
										note: comments_not_present_in_src,
										type: 2
									});
								}
							}
						}

						// 3-4-3. Find any unmatching code splits between Source Language Text and Translation Text
						for (const key in codesplits) {
							if(test_array[i][key] && defect_languages.length == 0 && JSON.stringify(codesplits["Source Language Text"].sort()) !== JSON.stringify(codesplits[key].sort())) {
								let splits = codesplits["Source Language Text"].sort();
								let splits2 = codesplits[key].sort();
								let note = "";
								let note2 = "";

								const counts = {};
								splits.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
								const counts2 = {};
								splits2.forEach(function (x) { counts2[x] = (counts2[x] || 0) + 1; });

								for(let key in counts) {
									if(counts[key] > counts2[key]) {
										note += (counts[key] - counts2[key]) + " more " + key + " found, ";
									} else if(counts[key] < counts2[key]) {
										note2 += (counts2[key] - counts[key]) + " more " + key + " found, ";
									}
								}

								note = note.substring(0, note.lastIndexOf(", "));
								note2 = note2.substring(0, note2.lastIndexOf(", "));

								defect_languages.push({
										language: key,
										defect: comments_unmatching_code,
										note,
										note2,
										type: 3
									});
							}
						}
						
						// 3-6. IF key "Defect Languages" IS NOT an empty array, PUSH test_array[i] object to result_array
						if(defect_languages.length > 0) {
							test_array[i]["Defect Languages"] = defect_languages;
							result_array.push(test_array[i]);
						}
						
					// CATCH
					} catch(e) {
						// 3-C-1. PUSH test_array[i] object to unidentified_array
						unidentified_array.push(test_array[i]);
					}
				}
				
				return {failed_strings: result_array, unidentified_strings: unidentified_array};
			}

			function setCommentsFlagColor(color) {
				let flag_element = document.getElementById("s_to_check_flag");

				switch(color) {
					case round_flag_red:
						flag_element.className = round_flag_red;
						break;
					case round_flag_orange:
						flag_element.className = round_flag_orange;
						break;
					case round_flag_green:
						flag_element.className = round_flag_green;
						break;
					default:
						flag_element.className = "";
				}
			}
			
			function checkString(isTouchingSourceText = false) {
				if(isTouchingSourceText) {
					document.getElementById("copied_string_id").innerText = "Source Language Text has been touched";
				}
			
				let src = document.getElementById("s_to_check_source").value;
				let trs = document.getElementById("s_to_check_translation").value;
				
				let result = runCodeIntegrityCheck({
					[`Source Language Text`]: [src],
					[`String Identifier`]: ["Test"],
					[`French text`]: [trs],
					[`French translationStatus`]: [3]
				});
				
				let text = comments_no_issue_found;
				
				if(result.failed_strings && result.failed_strings[0]) {
					let errorMessageArray = result.failed_strings[0]["Defect Languages"];
						
					if(errorMessageArray) {
						text = "";
						
						for(let i=0; i<errorMessageArray.length; i++) {
							let defect = errorMessageArray[i].defect;
							let note = errorMessageArray[i].type == 3 ? 
										(errorMessageArray[i].note ? "\nSource Language Text:\n" + errorMessageArray[i].note + "\n" : "") +
										(errorMessageArray[i].note2 ? "\nTranslation Text:\n" + errorMessageArray[i].note2 : "") :
										errorMessageArray[i].note;
							text += `${defect}`
							text += `\n${note}\n\n`;

							if(errorMessageArray[i].type == 3) {
								setCommentsFlagColor(round_flag_orange);
							} else if(errorMessageArray[i].type <= 2) {
								setCommentsFlagColor(round_flag_red);
							}
						}
					}
				}

				if(text == comments_no_issue_found) {
					setCommentsFlagColor(round_flag_green);
				}

				if(!src) {
					text = "Source Language Text is empty."
					setCommentsFlagColor("");
				} else if(!src.includes("<") && !src.includes(">") && !src.includes("{") && !src.includes("}") && !src.includes("[") && !src.includes("]")) {
					text = "Source Language Text does not contain any valid code brackets.\n\nValid Code Brackets: < OR > OR { OR } OR [ OR ]"
					setCommentsFlagColor("");
				} else if(!trs) {
					text = "Translation Text is empty."
					setCommentsFlagColor("");
				}
				
				document.getElementById("s_to_check_comments").value = text;
			}
			
			function displayCodeIntegrityCheckResults() {
				document.getElementById("bot_comments").hidden = false;
				document.getElementById("code_selector").style.display = "flex";
				document.getElementById("s_to_check").style.display = "flex";
				removeAllRows();

				let rows = [];
			
				for(let i=0; i<codeIntegrityCheckResults.failed_strings.length; i++) {
					let language_is_affected = false;
						
					codeIntegrityCheckResults.failed_strings[i]["Defect Languages"].map( obj => {
						if(obj["language"] == selectedLanguage + " text") {
							language_is_affected = true;
						}
					});
					
					if(language_is_affected && codeIntegrityCheckResults.failed_strings[i][selectedLanguage + " translationStatus"] == translationStatusGreen) {
						rows.push({
							string_id: codeIntegrityCheckResults.failed_strings[i]["String Identifier"],
							src_text: codeIntegrityCheckResults.failed_strings[i]["Source Language Text"],
							trs_text: codeIntegrityCheckResults.failed_strings[i][selectedLanguage + " text"],
							trs_stat: codeIntegrityCheckResults.failed_strings[i][selectedLanguage + " translationStatus"],
							trs_defect: codeIntegrityCheckResults.failed_strings[i]["Defect Languages"]
						});
					}
				}

				allRows = rows;
				pagination = 1;
				maxPagination = Math.ceil((allRows.length>0?allRows.length:1)/rowsPerPage);

				displayRows();
				
				document.getElementById("row_count").innerText = rowCount;
			}
			
			function getCodeIntegrityCheckResults() {
				removeAllRows();
				document.getElementById("search_row").hidden = true;
				document.getElementById("check_button").hidden = true;
				document.getElementById("search_button").hidden = false;
				isCheckMode = true;
				codeIntegrityCheckResults = runCodeIntegrityCheck(excel_json_data);
				// console.log(codeIntegrityCheckResults); // Comment out this line before launch
					
				displayCodeIntegrityCheckResults();
			}

            function handleFileLoadError(e) {
                document.getElementById("upload_status").innerHTML = `
                    An error occured while loading file! Please select a correct excel file or try reloading the page. <br>
                    If you want to report this error, log can be found by pressing Ctrl + Shift + I (under Console tab).
                `;
                console.log(e);
                document.getElementById("check_button").hidden = true;
                document.getElementById("search_row").hidden = false;
                document.getElementById("bot_comments").hidden = true;
                document.getElementById("code_selector").style.display = "none";
                document.getElementById("s_to_check").style.display = "none";
                isCheckMode = false;
            }

            function onSubmitFile() {
                try {
                    // (A) NEW FILE READER
                    var reader = new FileReader();
                    
                    var file = document.getElementById('file_input').files[0];
                
                    // (B) ON FINISH LOADING
                    reader.addEventListener("loadend", (evt) => {
                        try {
                            // (B1) GET THE FIRST WORKSHEET
                            var workbook = XLSX.read(evt.target.result, {type: "binary"}),
                                worksheet = workbook.Sheets[workbook.SheetNames[0]],
                                range = XLSX.utils.decode_range(worksheet["!ref"]);
                        
                            // (B2) READ HEADER ROW
                            var data = {}, keys = [];
                            for (let col=range.s.c; col<=range.e.c; col++) {
                                let cell = worksheet[XLSX.utils.encode_cell({r:0, c:col})];
                                let value = cell ? cell.v : '';
                                data[value] = [];
                                keys.push(value);
                            } 

							while (language_select.options.length > 0) {
								language_select.remove(0);
							}

							selectedLanguage = "Select Language";
							let newOption = new Option(selectedLanguage, selectedLanguage);
							language_select.add(newOption, undefined);

							for(let key of keys) {
								if(!key.toLowerCase().includes("source") && key.toLowerCase().includes(" text")) {
									let key_language = key.substr(0, key.toLowerCase().indexOf(" text"));
									let newOption = new Option(key_language, key_language);
									language_select.add(newOption, undefined);
								}
							}
                            
                            // (B3) READ DATA ROWS
							for (let row=range.s.r + 1; row<=range.e.r; row++) {
								for (let col=range.s.c; col<=range.e.c; col++) {
                                    let cell = worksheet[XLSX.utils.encode_cell({r:row, c:col})];
                                    let value = cell ? cell.v : '';
                                    data[keys[col]].push(value);
                                }
                            }
                            
                            // (B4) JSON ENCODE
                            excel_json_data = data;
                            document.getElementById("upload_status").innerHTML = "File Successfully Loaded";
							document.getElementById("search_button").hidden = true;
                            document.getElementById("check_button").hidden = false;
                            document.getElementById("search_row").hidden = false;
                            document.getElementById("bot_comments").hidden = true;
                            document.getElementById("code_selector").style.display = "none";
                            document.getElementById("s_to_check").style.display = "none";
                            isCheckMode = false;
                            removeAllRows();
                        } catch(e) {
                            handleFileLoadError(e);
                        }
                    });

					document.getElementById("file_name_display").innerHTML = document.getElementById('file_input').files[0].name;
					document.getElementById("file_name_display").hidden = false;
                
                    // (C) START - READ SELECTED EXCEL FILE
                    reader.readAsArrayBuffer(file);
                } catch(e) {
                    handleFileLoadError(e);
                }
            }

            document.getElementById("file_form").addEventListener("submit", function(evt) {
                evt.preventDefault(); // stop the submit

                document.getElementById("upload_status").innerHTML = `
                    <div style="display: flex; flex-direction: col; align-itmes: center;">
                        <img width="40px" height="40px" src="./assets/loading.gif" style="margin-left: .5rem; margin-right: 1rem;" alt="..."/>
                        <div style="flex:1; margin: auto;">
                            LOADING... Please wait. This may take a few seconds. <br>
                            If your browser asks you if you would like to wait, please click on wait button.
                        </div>
                    </div>
                `;

                setTimeout(onSubmitFile, 100);
            });

            function submitFileForm(files = null) {
				if(files) {
					document.getElementById('file_input').files = files;
				}
                document.getElementById("file_form").requestSubmit();
            }
			
			function easterEgg() {
				alert("\n\nYou found me! I was an intermediate/senior web/mobile application developer who worked on various projects! Send me a DM on Slack/Teams if you have any feedbacks or just want to say hello!\n\n\n- Heechan from LQA Team 4");
			}