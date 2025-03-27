import { Octokit } from "https://cdn.skypack.dev/@octokit/core";

let octokit;
let repos = [];
let milestones = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function get_week_date(d) {
    d = new Date(d);
    d.setHours(0,0,0,0);
    var day = d.getDay();
    var week_start_day = d.getDate() - day + (day == 0 ? -6:1);
    var week_end_day = week_start_day + 7;
    return {
        "week_start_date": new Date(d.setDate(week_start_day)),
        "week_end_date": new Date(d.setDate(week_end_day))
    }
}

function render_repos(data, cols) {
    var body = document.getElementById('repo-list');
    body.innerHTML = '';
    body.classList.remove('hidden');
    body.classList.add('block');
    
    var h3 = document.createElement('h2');
    h3.className = 'text-2xl font-semibold text-gray-800 mb-4';
    h3.innerText = "Repositories";
    body.appendChild(h3);
    
    var selectAllContainer = document.createElement('div');
    selectAllContainer.className = 'mb-4';
    
    var selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'inline-flex items-center cursor-pointer';
    
    var selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.className = 'h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2';
    selectAllCheckbox.onclick = function() {
        var checkboxes = document.querySelectorAll('#repo-list input[type=checkbox][name=selected_repos]');
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = this.checked;
        }
    };
    
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('Select All Repositories'));
    
    selectAllContainer.appendChild(selectAllLabel);
    body.appendChild(selectAllContainer);
    
    var tableContainer = document.createElement('div');
    tableContainer.className = 'overflow-x-auto';
    
    var tbl = document.createElement('table');
    tbl.className = 'min-w-full';
    
    var thead = document.createElement('thead');
    thead.className = 'bg-gray-100';
    
    var tr = document.createElement('tr');
    var headers = [""].concat(cols);
    
    for (var j = 0; j < headers.length; j++) {
        var th = document.createElement('th');
        th.className = 'px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider';
        th.appendChild(document.createTextNode(headers[j]));
        tr.appendChild(th);
    }
    
    thead.appendChild(tr);
    tbl.appendChild(thead);
    
    var tbdy = document.createElement('tbody');
    tbdy.className = 'divide-y divide-gray-200';
    
    for (var i = 0; i < data.length; i++) {
        var tr = document.createElement('tr');
        var item = data[i];
        
        var td = document.createElement('td');
        td.className = 'px-4 py-3';
        
        var checkbox_ele = document.createElement("INPUT");
        checkbox_ele.setAttribute("type", "checkbox");
        checkbox_ele.setAttribute("name", "selected_repos");
        checkbox_ele.setAttribute("value", data[i]);
        checkbox_ele.className = 'h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded';
        checkbox_ele.dataset.data = JSON.stringify(item);
        
        td.appendChild(checkbox_ele);
        tr.appendChild(td);
        
        for (var j = 0; j < cols.length; j++) {
            var td = document.createElement('td');
            td.className = 'px-4 py-3';
            td.appendChild(document.createTextNode(item[cols[j]]));
            tr.appendChild(td);
        }
        
        tbdy.appendChild(tr);
    }
    
    tbl.appendChild(tbdy);
    tableContainer.appendChild(tbl);
    body.appendChild(tableContainer);
    
    // Add helper text
    var helperText = document.createElement('p');
    helperText.className = 'text-sm text-gray-500 mt-4';
    helperText.textContent = 'Select the repositories where you want to create milestones. You can select multiple repositories.';
    body.appendChild(helperText);
}

function add_milestones_row() {
    var tbdy = document.querySelector('#milestone-table tbody');
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var due_on = document.getElementById("due_on").value;
    
    if (!title) {
        alert("Title is required");
        return;
    }
    
    if (due_on) {
        due_on = new Date(Date.parse(due_on)).toISOString();
    }
    
    var milestone = {
        "title": title,
        "description": description,
        "due_on": due_on
    }
    
    var tr = document.createElement('tr');
    tr.dataset.is_data = true;
    
    for (var key in milestone) {
        var th = document.createElement('td');
        th.className = 'px-4 py-3';
        th.dataset.type = 'value';
        th.dataset.name = key;
        th.dataset.value = milestone[key];
        th.appendChild(document.createTextNode(milestone[key]));
        tr.appendChild(th);
    }
    
    var th = document.createElement('td');
    th.className = 'px-4 py-3';
    th.dataset.type = 'action';
    
    var btn = document.createElement("button");
    btn.type = "button";
    btn.value = "Delete";
    btn.innerHTML = "Delete";
    btn.className = 'w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200';
    btn.onclick = delete_milestones_row;
    
    th.appendChild(btn);
    tr.appendChild(th);
    
    tbdy.insertBefore(tr, tbdy.childNodes[(tbdy.childNodes.length) - 2]);
    document.getElementById("title").value = '';
    document.getElementById("description").value = '';
    document.getElementById("due_on").value = '';
}

function delete_milestones_row(e) {
    this.parentNode.parentNode.remove();
}

async function load_repos() {
    var milestone_container = document.getElementById('milestone-list');
    milestone_container.classList.add('hidden');

    var btn = document.getElementById('load_repos_btn');
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading...';
    
    try {
        let token = document.getElementById("personal_access_token").value;
        if (!token) {
            throw {
                "message": "Please enter access token"
            };
        }
        octokit = new Octokit({ auth: token});
        var response = await octokit.request('GET /user/repos');
        repos = response.data;
    } catch (error) {
        alert(error.message);
        btn.disabled = false;
        btn.innerHTML = 'Load Repositories';
        return;
    }
    
    // render repos and milestones
    var cols = ["name", "git_url"];
    render_repos(repos, cols);
    
    btn.disabled = false;
    btn.innerHTML = 'Load Repositories';
    milestone_container.classList.remove('hidden');
    milestone_container.classList.add('block');
}

function get_milestones() {
    var milestones = [];
    var rows = document.querySelectorAll('#milestone-table tbody tr[data-is_data=true]');
    
    for (let i=0; i<rows.length; i++) {
        let row = rows[i];
        let cols = row.querySelectorAll('td[data-type="value"]');
        let milestone = {};
        
        for (let j=0; j < cols.length; j++) {
            milestone[cols[j].dataset.name] = cols[j].dataset.value;
        }
        
        milestones.push(milestone);
    }
    
    return milestones;
}

async function create_milestones() {
    var milestones = get_milestones();
    
    if (!milestones.length) {
        alert("Please add milestone");
        return;
    }
    
    var selected_repos_elements = document.querySelectorAll('#repo-list input[type=checkbox]:checked');
    var selected_repos = [];
    
    for (let i=0; i<selected_repos_elements.length; i++) {
        let selected_repo = JSON.parse(selected_repos_elements[i].dataset.data);
        selected_repos.push(selected_repo);
    }
    
    if (!selected_repos.length) {
        alert("Please select at least one repository");
        return;
    }
    
    var button = document.getElementById('create_milestone_btn');
    button.disabled = true;
    button.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
    
    var success_count = 0, fail_count = 0;
    
    for (let j=0; j<selected_repos.length; j++) {
        for (let i=0; i<milestones.length; i++) {
            try {
                let payload = {
                    owner: selected_repos[j].owner.login,
                    repo: selected_repos[j].name,
                    title: milestones[i].title
                };
                
                if (milestones[i].description) {
                    payload.description = milestones[i].description;
                }
                
                if (milestones[i].due_on) {
                    payload.due_on = milestones[i].due_on;
                }
                
                await octokit.request(`POST /repos/{owner}/{repo}/milestones`, payload);
                success_count += 1;
                button.innerHTML = `<span class="text-sm">${selected_repos[j].full_name} - ${milestones[i].title} created</span>`;
                await sleep(1000);
            } catch (error) {
                button.innerHTML = `<span class="text-sm">${selected_repos[j].full_name} - ${milestones[i].title} failed</span>`;
                await sleep(1500);
                console.error(error);
                fail_count += 1;
            }
        }
        
        button.innerHTML = `<span class="text-sm">${selected_repos[j].full_name} - Completed</span>`;
        await sleep(2000);
    }
    
    button.innerHTML = `<span>Success ${success_count}, Failed ${fail_count}</span>`;
    button.disabled = false;
    
    setTimeout(() => {
        button.innerHTML = 'Create Milestones';
    }, 3000);
}

// Export functions to global scope
window.create_milestones = create_milestones;
window.load_repos = load_repos;
window.add_milestones_row = add_milestones_row;
window.delete_milestones_row = delete_milestones_row;
window.get_milestones = get_milestones;
