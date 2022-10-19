
			const searchElement1 = document.querySelector('#s_search1');
			const searchElement2 = document.querySelector('#s_search2');
			const searchElement3 = document.querySelector('#s_search3');
			var excel_json_data;
			var selectedLanguage = "Language Not Selected";
			const modal = document.getElementById("help_modal");
			const span = document.getElementsByClassName("close")[0];
			var isCheckMode = false;
			var codeIntegrityCheckResults = {};

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
			
			function returnToSearch() {
				document.getElementById("search_button").hidden = true;
				document.getElementById("check_button").hidden = false;
				isCheckMode = false;
				document.getElementById("search_row").hidden = false;
				document.getElementById("bot_comments").hidden = true;
				document.getElementById("code_selector").style.display = "none";
				document.getElementById("s_to_check").style.display = "none";
				removeAllRows();
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
			
			function copyToClipboardAndStringChecker(element) {
				try {
					document.getElementById("s_to_check_source").value = element.children.item(1).innerText;
					document.getElementById("s_to_check_translation").value = element.children.item(2).innerText;
					checkString();
					document.getElementById("copied_string_id").innerHTML = element.children.item(0).children.item(0).innerText +
																			`<a style="margin-left: 1rem; cursor: pointer;" href="#` + element.children.item(0).children.item(0).innerText +`">Go back to Table</a>`;
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
			    if(translationStatus && translationStatus == "3") {
				  var table = document.getElementById("result_table");
				  var row = table.insertRow(2);
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
							let note = errorMessageArray[i].type == 3 ? "<br>" + escapeHtml(errorMessageArray[i].note) + "<br><br>" + escapeHtml(errorMessageArray[i].note2) : errorMessageArray[i].note;
							text += `${defect}`
							text += `<br><span style='color: grey; font-weight: bold; font-size: 0.9rem;'>${note}</span><br><br>`;
						}
					}
					
					cell4.innerHTML = text;
				  }
				  
				  rowCount = rowCount + 1;
			    }
			}

			function removeAllRows() {
			  var table = document.getElementById("result_table");
			  for(let i = 2; i<table.rows.length;){
				table.deleteRow(i);
			  }
			  rowCount = 0;
			  document.getElementById("row_count").innerText = rowCount == 0 ? '' : rowCount;
			}
			
			function searchForConsistency() {
			  var s1 = document.getElementById("s_search1").value;
			  var s2 = document.getElementById("s_search2").value;
			  var s3 = document.getElementById("s_search3").value;
			  
			  if(excel_json_data !== undefined) {
				  removeAllRows();
				  var string_ids = excel_json_data["String Identifier"];
				  
				  if(string_ids !== null) {
					  if(s1 && s2 && s3) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["String Identifier"][i].toLowerCase().includes(s1.toLowerCase()) &&
								excel_json_data["Source Language Text"][i].toLowerCase().includes(s2.toLowerCase()) &&
								excel_json_data[selectedLanguage + " text"][i].toLowerCase().includes(s3.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s1 && s2) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["String Identifier"][i].toLowerCase().includes(s1.toLowerCase()) &&
								excel_json_data["Source Language Text"][i].toLowerCase().includes(s2.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s1 && s3) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["String Identifier"][i].toLowerCase().includes(s1.toLowerCase()) &&
								excel_json_data[selectedLanguage + " text"][i].toLowerCase().includes(s3.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s2 && s3) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["Source Language Text"][i].toLowerCase().includes(s2.toLowerCase()) &&
								excel_json_data[selectedLanguage + " text"][i].toLowerCase().includes(s3.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s1) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["String Identifier"][i].toLowerCase().includes(s1.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s2) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data["Source Language Text"][i].toLowerCase().includes(s2.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } else if(s3) {
						for(var i=string_ids.length-1; i>=0; i--) {
							if( excel_json_data[selectedLanguage + " text"][i].toLowerCase().includes(s3.toLowerCase()) ) {
								addRow(excel_json_data["String Identifier"][i], excel_json_data["Source Language Text"][i], excel_json_data[selectedLanguage + " text"] ? excel_json_data[selectedLanguage + " text"][i] : "", excel_json_data[selectedLanguage + " translationStatus"] ? excel_json_data[selectedLanguage + " translationStatus"][i] : "");
							}
						}
					  } 
					  document.getElementById("row_count").innerText = rowCount == 0 ? '' : rowCount;
				  }
			  }
			  
			  if(!s1 && !s2 && !s3) {
				removeAllRows();
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
					if(source_array["Source Language Text"][i] && (source_array["Source Language Text"][i].includes("</") || source_array["Source Language Text"][i].includes("/>") || source_array["Source Language Text"][i].includes("{") || source_array["Source Language Text"][i].includes("}")
					|| source_array["Source Language Text"][i].includes("[") || source_array["Source Language Text"][i].includes("]"))) {
						test_array.push({
							["String Identifier"]: source_array["String Identifier"][i],
							["French translationStatus"]: source_array["French translationStatus"] ? source_array["French translationStatus"][i] : null,
							["Brazilian Portuguese translationStatus"]: source_array["Brazilian Portuguese translationStatus"] ? source_array["Brazilian Portuguese translationStatus"][i] : null,
							["Polish translationStatus"]: source_array["Polish translationStatus"] ? source_array["Polish translationStatus"][i] : null,
							["Mexican Spanish translationStatus"]: source_array["Mexican Spanish translationStatus"] ? source_array["Mexican Spanish translationStatus"][i] : null,
							["Italian translationStatus"]: source_array["Italian translationStatus"] ? source_array["Italian translationStatus"][i] : null,
							["Japanese translationStatus"]: source_array["Japanese translationStatus"] ? source_array["Japanese translationStatus"][i] : null,
							["Arabic translationStatus"]: source_array["Arabic translationStatus"] ? source_array["Arabic translationStatus"][i] : null,
							["Simplified Chinese translationStatus"]: source_array["Simplified Chinese translationStatus"] ? source_array["Simplified Chinese translationStatus"][i] : null,
							["Traditional Chinese translationStatus"]: source_array["Traditional Chinese translationStatus"] ? source_array["Traditional Chinese translationStatus"][i] : null,
							["Korean translationStatus"]: source_array["Korean translationStatus"] ? source_array["Korean translationStatus"][i] : null,
							["Russian translationStatus"]: source_array["Russian translationStatus"] ? source_array["Russian translationStatus"][i] : null,
							["German translationStatus"]: source_array["German translationStatus"] ? source_array["German translationStatus"][i] : null,
							["Spanish translationStatus"]: source_array["Spanish translationStatus"] ? source_array["Spanish translationStatus"][i] : null,
							["Turkish translationStatus"]: source_array["Turkish translationStatus"] ? source_array["Turkish translationStatus"][i] : null,
							["Source Language Text"]: source_array["Source Language Text"][i],
							["French text"]: source_array["French text"] ? source_array["French text"][i] : null,
							["Turkish text"]: source_array["Turkish text"] ? source_array["Turkish text"][i] : null,
							["Brazilian Portuguese text"]: source_array["Brazilian Portuguese text"] ? source_array["Brazilian Portuguese text"][i] : null,
							["Polish text"]: source_array["Polish text"] ? source_array["Polish text"][i] : null,
							["Mexican Spanish text"]: source_array["Mexican Spanish text"] ? source_array["Mexican Spanish text"][i] : null,
							["Italian text"]: source_array["Italian text"] ? source_array["Italian text"][i] : null,
							["Japanese text"]: source_array["Japanese text"] ? source_array["Japanese text"][i] : null,
							["Arabic text"]: source_array["Arabic text"] ? source_array["Arabic text"][i] : null,
							["Simplified Chinese text"]: source_array["Simplified Chinese text"] ? source_array["Simplified Chinese text"][i] : null,
							["Traditional Chinese text"]: source_array["Traditional Chinese text"] ? source_array["Traditional Chinese text"][i] : null,
							["Korean text"]: source_array["Korean text"] ? source_array["Korean text"][i] : null,
							["Russian text"]: source_array["Russian text"] ? source_array["Russian text"][i] : null,
							["German text"]: source_array["German text"] ? source_array["German text"][i] : null,
							["Spanish text"]: source_array["Spanish text"] ? source_array["Spanish text"][i] : null
						});
					}
				}
				
				// 3. LOOP through the test_array
				for(let i=0; i<test_array.length; i++) {
				
					// TRY
					try {
						let codesplits = {};
						let index = 0;
					
						for (const key in test_array[i]) {
						
							// 3-1. Get Source Text from the string object
							let text = test_array[i][key];
						
							let matches = [];
							
							// 3-2. SUBSTRING text splits that MATCH a pattern of "<.*>" OR "\{\{.*\}\}" OR "\{.*\}" OR "\\[\\[.*\\]\\]" OR "\\[.*\\]"
							while (null !== (matchArr = regex.exec(text))) {
								matches.push(matchArr[0]);
							}
							
							// 3-3. PUSH an element to the array of strings(codesplits) with substringed splits for each string
							
							// IF the key is not String ID or Translation Status as we don't want those in codesplits array
							if(index > 14) { 
								codesplits[key] = matches;
							}
							
							index = index + 1;
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
								defect_languages.push({
										language: key,
										defect: comments_unmatching_code,
										note: "Source Language Text: " + JSON.stringify(codesplits["Source Language Text"].sort()),
										note2: "Translation Text: " + JSON.stringify(codesplits[key].sort()),
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
					document.getElementById("copied_string_id").innerText = "";
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
							let note = errorMessageArray[i].type == 3 ? "\n" + errorMessageArray[i].note + "\n\n" + errorMessageArray[i].note2 : errorMessageArray[i].note;
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
				} else if(!src.includes("</") && !src.includes("/>") && !src.includes("{") && !src.includes("}") && !src.includes("[") && !src.includes("]")) {
					text = "Source Language Text does not contain any valid code brackets.\n\nValid Code Brackets: </ OR /> OR { OR } OR [ OR ]"
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
			
				for(let i=0; i<codeIntegrityCheckResults.failed_strings.length; i++) {
					let language_is_affected = false;
						
					codeIntegrityCheckResults.failed_strings[i]["Defect Languages"].map( obj => {
						if(obj["language"] == selectedLanguage + " text") {
							language_is_affected = true;
						}
					});
					
					if(language_is_affected) {
						addRow(codeIntegrityCheckResults.failed_strings[i]["String Identifier"], codeIntegrityCheckResults.failed_strings[i]["Source Language Text"],
						codeIntegrityCheckResults.failed_strings[i][selectedLanguage + " text"], codeIntegrityCheckResults.failed_strings[i][selectedLanguage + " translationStatus"], codeIntegrityCheckResults.failed_strings[i]["Defect Languages"]);
					    document.getElementById("row_count").innerText = rowCount == 0 ? '' : rowCount;
					}
				}
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

            document.getElementById("file_form").addEventListener("submit", function(evt) {
                evt.preventDefault(); // stop the submit

                document.getElementById("upload_status").innerHTML = `
                    <div style="display: flex; flex-direction: col; align-itmes: center;">
                        <img width="40px" height="40px" src="./loading.gif" style="margin-left: .5rem; margin-right: 1rem;" alt="..."/>
                        <div style="flex:1; margin: auto;">
                            LOADING... Please wait. This may take a few seconds. <br>
                            If your browser asks you if you would like to wait, please click on wait button.
                        </div>
                    </div>
                `;

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
                
                    // (C) START - READ SELECTED EXCEL FILE
                    reader.readAsArrayBuffer(file);
                } catch(e) {
                    handleFileLoadError(e);
                }
            });

            function submitFileForm() {
                document.getElementById("file_form").requestSubmit();
            }
			
			function easterEgg() {
				alert("\n\nYou found me here! How did I make this website? I was a former intermediate-senior web/mobile application developer who worked on various projects! Send me a DM on Slack/Teams if you have any feedbacks or just want to say hello!\n\n\n- Heechan from LQA Team 4");
			}