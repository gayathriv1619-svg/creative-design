// ═══════════════════════════════════════════════
// LIBRARY SYSTEM
// ═══════════════════════════════════════════════

const libState = {
  view: 'grid',      // 'grid' | 'list'
  fdView: 'grid',
  section: 'all',    // 'all' | 'unsorted' | folderId
  currentFolderId: null,
  selectedImages: new Set(),
  fdSelectedImages: new Set(),
  ctxImageId: null,
  fpSelectedFolder: null,
  fpFromDetail: false,
  cfCallback: null,
  cfColor: '#2563EB',
  cfParentId: null,
  undoData: null,
  toastTimer: null,
  shareAccessLevel: 'restricted',
  shareMembers: [
    { avatar: 'G', name: 'gayathri', email: 'gayathri@zocket.com', role: 'owner', pending: false }
  ],
  folders: [
    { id: 'f1', name: 'Dabur Vatika Q2 Ads', color: '#2563EB', parentId: null, created: '2 hrs ago', modified: '2 hrs ago' },
    { id: 'f2', name: 'Yoga Brand', color: '#16a34a', parentId: null, created: '3 days ago', modified: '3 days ago' },
    { id: 'f3', name: 'Campaign 2025', color: '#dc2626', parentId: null, created: '5 days ago', modified: '5 days ago' }
  ],
  images: [
    { id: 'im1', name: 'Vatika Ad 1', src: 'images/vatika-1.jpg', folderId: 'f1', created: '2 hrs ago', modified: '2 hrs ago' },
    { id: 'im2', name: 'Vatika Ad 2', src: 'images/vatika-2.jpg', folderId: 'f1', created: '2 hrs ago', modified: '2 hrs ago' },
    { id: 'im3', name: 'Vatika Ad 3', src: 'images/vatika-3.jpg', folderId: 'f1', created: '2 hrs ago', modified: '2 hrs ago' },
    { id: 'im4', name: 'Vatika Ad 4', src: 'images/vatika-4.jpg', folderId: 'f1', created: '2 hrs ago', modified: '2 hrs ago' }
  ]
};

// ── Navigation ──
function openLibrary() {
  document.getElementById('lib-view').style.display = 'flex';
  libRender();
}
function closeLibrary() {
  document.getElementById('lib-view').style.display = 'none';
}
function openFolderDetail(folderId) {
  libState.currentFolderId = folderId;
  libState.fdSelectedImages.clear();
  document.getElementById('folder-detail-view').style.display = 'flex';
  renderFolderDetail();
}
function closeFolderDetail() {
  document.getElementById('folder-detail-view').style.display = 'none';
  libState.currentFolderId = null;
  openLibrary();
}

// ── Library sidebar section ──
function libSetSection(sec) {
  libState.section = sec;
  document.querySelectorAll('.lib-sb-item').forEach(el => el.classList.remove('lib-sb-active'));
  document.querySelectorAll('#lib-sb-folders .lib-sb-folder').forEach(el => el.classList.remove('active'));
  const target = document.querySelector('[data-section="' + sec + '"]');
  if (target) target.classList.add('lib-sb-active');
  const pageTitle = document.getElementById('lib-page-title');
  if (sec === 'all') pageTitle.textContent = 'Folder';
  else if (sec === 'unsorted') pageTitle.textContent = 'Unsorted';
  libRender();
}

function libSetView(v) {
  libState.view = v;
  document.getElementById('lib-vt-grid').classList.toggle('lib-vt-active', v === 'grid');
  document.getElementById('lib-vt-list').classList.toggle('lib-vt-active', v === 'list');
  libRender();
}
function fdSetView(v) {
  libState.fdView = v;
  document.getElementById('fd-vt-grid').classList.toggle('lib-vt-active', v === 'grid');
  document.getElementById('fd-vt-list').classList.toggle('lib-vt-active', v === 'list');
  renderFolderDetail();
}

// ── Main library render ──
function libRender() {
  renderLibSidebar();
  const content = document.getElementById('lib-content');
  const section = libState.section;
  let html = '';

  if (section === 'all') {
    const topFolders = getChildFolders(null);
    html += '<div class="lib-section-heading">Folders (' + topFolders.length + ')</div>';
    html += libState.view === 'grid' ? renderFoldersGrid(topFolders) : renderFoldersList(topFolders);
  } else if (section === 'unsorted') {
    const imgs = libState.images.filter(i => !i.folderId);
    if (!imgs.length) {
      html = '<div class="lib-empty"><div class="lib-empty-icon">📂</div><div class="lib-empty-title">No unsorted images</div><div class="lib-empty-desc">All your images are organized in folders.</div></div>';
    } else {
      html += '<div class="lib-section-heading">Unsorted (' + imgs.length + ')</div>';
      html += libState.view === 'grid' ? renderImgsGrid(imgs, false) : renderImgsList(imgs, false);
    }
  } else {
    // A folder was clicked from sidebar
    openFolderDetail(section);
    return;
  }

  content.innerHTML = html;
  bindImgCardEvents('#lib-content', false);
}

function getChildFolders(parentId) {
  return libState.folders.filter(f => (f.parentId || null) === parentId);
}

function getDescendantFolderIds(folderId) {
  const ids = [folderId];
  getChildFolders(folderId).forEach(child => {
    ids.push(...getDescendantFolderIds(child.id));
  });
  return ids;
}

function renderFoldersGrid(folders) {
  const folderList = folders || getChildFolders(null);
  if (!folderList.length) return '<div class="lib-empty"><div class="lib-empty-icon">📁</div><div class="lib-empty-title" style="color:#aaa">No folders yet</div><div class="lib-empty-desc" style="color:#666">Click Create to make your first folder.</div></div>';
  if (!folders && libState.view === 'list') return renderFoldersList(folderList);
  let html = '<div class="lib-folders-grid">';
  folderList.forEach(f => {
    const count = libState.images.filter(i => i.folderId === f.id).length;
    const folderIcon = '<div class="lib-folder-preview-empty"><svg width="50" height="38" viewBox="0 0 50 38" fill="none"><path d="M5 10.5C5 8.57 6.57 7 8.5 7H21.8C22.9 7 23.94 7.52 24.6 8.4L27.2 11.8H41.5C43.43 11.8 45 13.37 45 15.3V28.5C45 30.43 43.43 32 41.5 32H8.5C6.57 32 5 30.43 5 28.5V10.5Z" fill="#d5d5d5"/></svg></div>';
    html += '<div class="lib-folder-card" onclick="openFolderDetail(\'' + f.id + '\')" oncontextmenu="folderCtxMenu(event,\'' + f.id + '\')">';
    html += '<div class="lib-folder-preview">' + folderIcon + '</div>';
    html += '<button class="lib-folder-menu" onclick="event.stopPropagation();folderCtxMenu(event,\'' + f.id + '\')" title="More options">';
    html += '<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="3.5" cy="7.5" r="1.3" fill="#888"/><circle cx="7.5" cy="7.5" r="1.3" fill="#888"/><circle cx="11.5" cy="7.5" r="1.3" fill="#888"/></svg>';
    html += '</button>';
    html += '<div class="lib-folder-foot">';
    html += '<div class="lib-folder-dot" style="background:' + f.color + '"></div>';
    html += '<div class="lib-folder-name">' + f.name + '</div>';
    html += '<div class="lib-folder-count">' + count + '</div>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderFoldersList(folders) {
  const folderList = folders || getChildFolders(null);
  let html = '<table class="lib-list-table"><thead><tr>';
  html += '<th>Name</th><th>Last modified</th><th>Created</th><th>Active in file</th><th style="width:120px"></th>';
  html += '</tr></thead><tbody>';
  folderList.forEach(f => {
    const firstImg = libState.images.find(i => i.folderId === f.id);
    const thumb = firstImg
      ? '<img class="lib-list-thumb" src="' + firstImg.src + '" onerror="this.style.background=\'#f0f0f0\'"/>'
      : '<div class="lib-list-thumb lib-list-folder-thumb" style="color:' + f.color + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7h7l2 3h9v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="currentColor" opacity=".14"/><path d="M3 7h7l2 3h9v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></div>';
    html += '<tr class="lib-list-row lib-folder-list-row" onclick="openFolderDetail(\'' + f.id + '\')">';
    html += '<td><div class="lib-list-name-cell">' + thumb + '<span class="lib-list-name-text">' + f.name + '</span></div></td>';
    html += '<td>' + f.modified + '</td><td>' + f.created + '</td>';
    html += '<td>' + libState.images.filter(i => i.folderId === f.id).length + ' file' + (libState.images.filter(i => i.folderId === f.id).length !== 1 ? 's' : '') + '</td>';
    html += '<td><div class="lib-list-actions">' +
      '<button class="lib-list-action-btn" onclick="event.stopPropagation();shareFolderFromCtx(\'' + f.id + '\')" title="Share">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="10.5" cy="3" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="3" cy="7" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="10.5" cy="11" r="1.8" stroke="currentColor" stroke-width="1.2"/><path d="M4.8 7.9l3.8 2.3M8.6 3.8L4.8 6.1" stroke="currentColor" stroke-width="1.2"/></svg>' +
      '</button>' +
      '<button class="lib-list-action-btn lib-list-action-danger" onclick="event.stopPropagation();deleteFolder(\'' + f.id + '\')" title="Delete">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M4.5 3.5v8h5v-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
    '</div></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function renderImgsGrid(imgs, inDetail) {
  let html = '<div class="lib-imgs-grid">';
  imgs.forEach(img => {
    const sel = inDetail ? libState.fdSelectedImages.has(img.id) : libState.selectedImages.has(img.id);
    html += '<div class="lib-img-card' + (sel ? ' selected' : '') + '" data-id="' + img.id + '">';
    html += '<img class="lib-img-thumb" src="' + img.src + '" onerror="this.style.background=\'linear-gradient(135deg,#1a5c3a,#237a4e)\'" />';
    html += '<div class="lib-img-check"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>';
    html += '<div class="lib-img-name">' + img.name + '</div>';
    html += '<div class="lib-img-meta">' + img.modified + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function renderImgsList(imgs, inDetail) {
  let html = '<table class="lib-list-table"><thead><tr>';
  html += '<th>Name</th><th>Last modified</th><th>Created</th><th>Active in file</th><th style="width:120px"></th>';
  html += '</tr></thead><tbody>';
  imgs.forEach(img => {
    const sel = inDetail ? libState.fdSelectedImages.has(img.id) : libState.selectedImages.has(img.id);
    html += '<tr class="lib-list-row lib-img-list-row' + (sel ? ' selected' : '') + '" data-id="' + img.id + '">';
    html += '<td><div class="lib-list-name-cell"><img class="lib-list-thumb" src="' + img.src + '" onerror="this.style.background=\'#e8e8e8\'"/><span class="lib-list-name-text">' + img.name + '</span></div></td>';
    html += '<td>' + img.modified + '</td><td>' + img.created + '</td>';
    html += '<td>Image file</td>';
    html += '<td><div class="lib-list-actions">' +
      '<button class="lib-list-action-btn" onclick="event.stopPropagation();shareImageFromList(\'' + img.id + '\')" title="Share">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="10.5" cy="3" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="3" cy="7" r="1.8" stroke="currentColor" stroke-width="1.2"/><circle cx="10.5" cy="11" r="1.8" stroke="currentColor" stroke-width="1.2"/><path d="M4.8 7.9l3.8 2.3M8.6 3.8L4.8 6.1" stroke="currentColor" stroke-width="1.2"/></svg>' +
      '</button>' +
      '<button class="lib-list-action-btn lib-list-action-danger" onclick="event.stopPropagation();deleteImageById(\'' + img.id + '\')" title="Delete">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M4.5 3.5v8h5v-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
    '</div></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function bindImgCardEvents(containerSel, inDetail) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  // Grid card clicks
  container.querySelectorAll('.lib-img-card').forEach(card => {
    card.onclick = () => toggleImgSelect(card.dataset.id, inDetail);
    card.oncontextmenu = (e) => { e.preventDefault(); showCtxMenu(e, card.dataset.id); };
  });
  // List row clicks
  container.querySelectorAll('.lib-img-list-row').forEach(row => {
    row.onclick = (e) => { if (e.target.type === 'checkbox') return; toggleImgSelect(row.dataset.id, inDetail); };
    row.querySelector('input[type=checkbox]')?.addEventListener('change', function() {
      toggleImgSelect(row.dataset.id, inDetail);
    });
    row.oncontextmenu = (e) => { e.preventDefault(); showCtxMenu(e, row.dataset.id); };
  });
}

// ── Folder detail render ──
function renderFolderDetail() {
  const f = libState.folders.find(x => x.id === libState.currentFolderId);
  if (!f) return;
  const childFolders = getChildFolders(libState.currentFolderId);
  const imgs = libState.images.filter(i => i.folderId === libState.currentFolderId);

  document.getElementById('fd-folder-icon').style.background = f.color + '22';
  document.getElementById('fd-folder-icon').style.color = f.color;
  document.getElementById('fd-folder-name').textContent = f.name;
  document.getElementById('fd-meta').textContent = childFolders.length + ' folder' + (childFolders.length !== 1 ? 's' : '') + ' · ' + imgs.length + ' image' + (imgs.length !== 1 ? 's' : '') + ' · Created by gayathri';
  document.getElementById('sm-title').textContent = 'Share "' + f.name + '"';

  renderFdSidebar();

  const content = document.getElementById('fd-content');
  if (!childFolders.length && !imgs.length) {
    content.innerHTML = '<div class="lib-empty"><div class="lib-empty-icon">🖼</div><div class="lib-empty-title">This folder is empty</div><div class="lib-empty-desc">Create a folder or move images here from the canvas or library.</div></div>';
    return;
  }
  let html = '';
  if (childFolders.length) {
    html += '<div class="lib-section-heading">Folders (' + childFolders.length + ')</div>';
    html += libState.fdView === 'grid' ? renderFoldersGrid(childFolders) : renderFoldersList(childFolders);
  }
  if (imgs.length) {
    html += '<div class="lib-section-heading">Images (' + imgs.length + ')</div>';
    html += libState.fdView === 'grid' ? renderImgsGrid(imgs, true) : renderImgsList(imgs, true);
  }
  content.innerHTML = html;
  bindImgCardEvents('#fd-content', true);
}

function renderLibSidebar() {
  const sb = document.getElementById('lib-sb-folders');
  sb.innerHTML = libState.folders.map(f => {
    const count = libState.images.filter(i => i.folderId === f.id).length;
    return '<div class="lib-sb-folder' + (libState.section === f.id ? ' active' : '') + '" onclick="libSetSection(\'' + f.id + '\')">' +
      '<div class="lib-sb-folder-dot" style="background:' + f.color + '"></div>' +
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + f.name + '</span>' +
      '<span class="lib-sb-folder-count">' + count + '</span>' +
      '</div>';
  }).join('');
}

function renderFdSidebar() {
  const sb = document.getElementById('fd-sb-folders');
  sb.innerHTML = libState.folders.map(f => {
    const count = libState.images.filter(i => i.folderId === f.id).length;
    return '<div class="lib-sb-folder' + (libState.currentFolderId === f.id ? ' active' : '') + '" onclick="openFolderDetail(\'' + f.id + '\')">' +
      '<div class="lib-sb-folder-dot" style="background:' + f.color + '"></div>' +
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + f.name + '</span>' +
      '<span class="lib-sb-folder-count">' + count + '</span>' +
      '</div>';
  }).join('');
}

// ── Image selection ──
function toggleImgSelect(id, inDetail) {
  const set = inDetail ? libState.fdSelectedImages : libState.selectedImages;
  if (set.has(id)) set.delete(id); else set.add(id);
  updateBulkBar(inDetail);
  if (inDetail) renderFolderDetail(); else libRender();
}
function libClearSelection() {
  libState.selectedImages.clear();
  updateBulkBar(false);
  libRender();
}
function fdClearSelection() {
  libState.fdSelectedImages.clear();
  updateBulkBar(true);
  renderFolderDetail();
}
function updateBulkBar(inDetail) {
  const set = inDetail ? libState.fdSelectedImages : libState.selectedImages;
  const bar = document.getElementById(inDetail ? 'fd-bulk-bar' : 'lib-bulk-bar');
  const countEl = document.getElementById(inDetail ? 'fd-sel-count' : 'lib-sel-count');
  const n = set.size;
  bar.style.display = n > 0 ? 'flex' : 'none';
  if (countEl) countEl.textContent = n + ' selected';
}

// ── Folder CRUD ──
function openCreateFolder(callback, parentId) {
  libState.cfCallback = callback || null;
  libState.cfParentId = parentId === undefined ? null : parentId;
  libState.cfColor = '#2563EB';
  document.getElementById('cf-name-input').value = '';
  document.getElementById('cf-error').style.display = 'none';
  document.getElementById('cf-name-input').classList.remove('error');
  document.querySelectorAll('.cf-color').forEach(el => {
    el.classList.toggle('cf-c-active', el.dataset.color === '#2563EB');
  });
  document.getElementById('cf-overlay').style.display = 'block';
  document.getElementById('cf-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('cf-name-input').focus(), 50);
}
function openCreateFolderFromPicker() {
  closeFolderPicker();
  openCreateFolder(function(_id) { openFolderPicker(libState.fpFromDetail); });
}
function createChildFolder() {
  openCreateFolder(null, libState.currentFolderId);
}
function closeCreateFolder() {
  document.getElementById('cf-overlay').style.display = 'none';
  document.getElementById('cf-modal').style.display = 'none';
  libState.cfParentId = null;
}
function pickFolderColor(el) {
  document.querySelectorAll('.cf-color').forEach(c => c.classList.remove('cf-c-active'));
  el.classList.add('cf-c-active');
  libState.cfColor = el.dataset.color;
}
function cfValidate() {
  const val = document.getElementById('cf-name-input').value.trim();
  const exists = libState.folders.some(f => (f.parentId || null) === libState.cfParentId && f.name.toLowerCase() === val.toLowerCase());
  const errEl = document.getElementById('cf-error');
  const inp = document.getElementById('cf-name-input');
  if (exists && val.length > 0) { errEl.style.display = 'block'; inp.classList.add('error'); }
  else { errEl.style.display = 'none'; inp.classList.remove('error'); }
}
function cfSubmit() {
  const val = document.getElementById('cf-name-input').value.trim();
  if (!val) { document.getElementById('cf-name-input').classList.add('error'); return; }
  if (libState.folders.some(f => (f.parentId || null) === libState.cfParentId && f.name.toLowerCase() === val.toLowerCase())) return;
  const newId = 'f' + Date.now();
  const parentId = libState.cfParentId;
  libState.folders.push({ id: newId, name: val, color: libState.cfColor, parentId, created: 'Just now', modified: 'Just now' });
  closeCreateFolder();
  libShowToast('Folder "' + val + '" created');
  if (libState.cfCallback) { libState.cfCallback(newId); return; }
  if (parentId) renderFolderDetail(); else libRender();
}
function deleteFolder(folderId) {
  if (!confirm('Delete this folder? Images will move to Unsorted.')) return;
  const idsToDelete = getDescendantFolderIds(folderId);
  libState.images.forEach(i => { if (idsToDelete.includes(i.folderId)) i.folderId = null; });
  libState.folders = libState.folders.filter(f => !idsToDelete.includes(f.id));
  libShowToast('Folder deleted');
  if (idsToDelete.includes(libState.currentFolderId)) {
    document.getElementById('folder-detail-view').style.display = 'none';
    libState.currentFolderId = null;
    openLibrary();
  } else if (libState.currentFolderId) {
    renderFolderDetail();
  } else {
    libRender();
  }
}

// ── Folder context menu ──
function folderCtxMenu(e, folderId) {
  e.preventDefault(); e.stopPropagation();
  document.querySelectorAll('.lib-folder-ctx-popup').forEach(el => el.remove());
  const menu = document.createElement('div');
  menu.className = 'lib-ctx-menu lib-folder-ctx-popup';
  // Adjust position so menu stays within viewport
  const x = Math.min(e.clientX, window.innerWidth - 180);
  const y = Math.min(e.clientY, window.innerHeight - 160);
  menu.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px';
  menu.innerHTML =
    '<div class="lib-ctx-item" onclick="downloadFolder(\'' + folderId + '\')">' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v7M3.5 7l3 3 3-3M1.5 11h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Download' +
    '</div>' +
    '<div class="lib-ctx-item" onclick="renameFolderPrompt(\'' + folderId + '\')">' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5l5.5-5.5 1.5 1.5L3.5 11H2V9.5zM9 3.5l.5-.5a1.1 1.1 0 0 1 1.5 1.5l-.5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>Rename' +
    '</div>' +
    '<div class="lib-ctx-item" onclick="shareFolderFromCtx(\'' + folderId + '\')">' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="2.5" cy="6.5" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="9.5" cy="10.5" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 7.2l3.5 2M7.5 3.3L4 5.5" stroke="currentColor" stroke-width="1.2"/></svg>Share' +
    '</div>' +
    '<div class="lib-ctx-divider"></div>' +
    '<div class="lib-ctx-item lib-ctx-danger" onclick="deleteFolder(\'' + folderId + '\')">' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M4 3v8h5V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Delete' +
    '</div>';
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function rm() { menu.remove(); document.removeEventListener('click', rm); }), 10);
}

function downloadFolder(folderId) {
  const f = libState.folders.find(x => x.id === folderId);
  if (f) libShowToast('Downloading "' + f.name + '"…');
}

function shareFolderFromCtx(folderId) {
  libState.currentFolderId = folderId;
  const f = libState.folders.find(x => x.id === folderId);
  if (f) document.getElementById('sm-title').textContent = 'Share "' + f.name + '"';
  openShareModal();
}
function renameFolderPrompt(folderId) {
  const f = libState.folders.find(x => x.id === folderId);
  if (!f) return;
  const newName = prompt('Rename folder:', f.name);
  if (!newName || !newName.trim()) return;
  if (libState.folders.some(x => x.id !== folderId && x.name.toLowerCase() === newName.trim().toLowerCase())) {
    libShowToast('A folder with that name already exists');
    return;
  }
  f.name = newName.trim();
  libShowToast('Folder renamed');
  libRender();
}

// ── Context menu for images ──
function showCtxMenu(e, imageId) {
  libState.ctxImageId = imageId;
  const menu = document.getElementById('lib-ctx-menu');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.style.display = 'block';
  setTimeout(() => document.addEventListener('click', function rm() { menu.style.display = 'none'; document.removeEventListener('click', rm); }), 10);
}
function ctxMoveToFolder() {
  openFolderPicker(!!libState.currentFolderId);
}
function deleteImageById(id) {
  if (!id) return;
  const img = libState.images.find(i => i.id === id);
  if (!img) return;
  libState.undoData = { type: 'delete', images: [{ ...img }] };
  libState.images = libState.images.filter(i => i.id !== id);
  libShowToast('Image deleted', true);
  if (libState.currentFolderId) renderFolderDetail(); else libRender();
}
function ctxDeleteImage() {
  deleteImageById(libState.ctxImageId);
}
function shareImageFromList(imageId) {
  const img = libState.images.find(i => i.id === imageId);
  if (img) document.getElementById('sm-title').textContent = 'Share "' + img.name + '"';
  openShareModal();
}

// ── Folder picker modal ──
function openFolderPicker(fromDetail) {
  libState.fpFromDetail = !!fromDetail;
  libState.fpSelectedFolder = null;
  const list = document.getElementById('fp-list');
  list.innerHTML = libState.folders.map(f => {
    const count = libState.images.filter(i => i.folderId === f.id).length;
    return '<div class="fp-item" data-id="' + f.id + '" onclick="fpSelectFolder(this,\'' + f.id + '\')">' +
      '<div class="fp-item-dot" style="background:' + f.color + '"></div>' +
      '<span class="fp-item-name">' + f.name + '</span>' +
      '<span class="fp-item-count">' + count + ' images</span>' +
      '</div>';
  }).join('') || '<div style="padding:16px;text-align:center;color:#aaa;font-size:13px">No folders yet</div>';
  document.getElementById('fp-overlay').style.display = 'block';
  document.getElementById('fp-modal').style.display = 'flex';
}
function fpSelectFolder(el, folderId) {
  document.querySelectorAll('.fp-item').forEach(i => { i.classList.remove('selected'); i.querySelector('.fp-item-check')?.remove(); });
  el.classList.add('selected');
  el.innerHTML += '<svg class="fp-item-check" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round"/></svg>';
  libState.fpSelectedFolder = folderId;
}
function closeFolderPicker() {
  document.getElementById('fp-overlay').style.display = 'none';
  document.getElementById('fp-modal').style.display = 'none';
}
function confirmMove() {
  if (!libState.fpSelectedFolder) { libShowToast('Please select a folder first'); return; }
  const targetFolder = libState.folders.find(f => f.id === libState.fpSelectedFolder);
  const set = libState.fpFromDetail ? libState.fdSelectedImages : libState.selectedImages;
  const ids = libState.ctxImageId && set.size === 0 ? [libState.ctxImageId] : [...set];
  if (!ids.length) { closeFolderPicker(); return; }
  libState.undoData = { type: 'move', ids: [...ids], prevFolders: ids.map(id => ({ id, folderId: libState.images.find(i => i.id === id)?.folderId || null })), targetId: libState.fpSelectedFolder };
  ids.forEach(id => { const img = libState.images.find(i => i.id === id); if (img) img.folderId = libState.fpSelectedFolder; });
  libState.selectedImages.clear(); libState.fdSelectedImages.clear(); libState.ctxImageId = null;
  closeFolderPicker();
  libShowToast(ids.length + ' image' + (ids.length > 1 ? 's' : '') + ' moved to "' + targetFolder.name + '"', true);
  if (libState.currentFolderId) renderFolderDetail(); else libRender();
}
function bulkMoveImages(inDetail) {
  libState.ctxImageId = null;
  openFolderPicker(inDetail);
}
function bulkDeleteImages(inDetail) {
  const set = inDetail ? libState.fdSelectedImages : libState.selectedImages;
  const ids = [...set];
  if (!ids.length) return;
  libState.undoData = { type: 'delete', images: ids.map(id => ({ ...libState.images.find(i => i.id === id) })) };
  libState.images = libState.images.filter(i => !ids.includes(i.id));
  set.clear(); updateBulkBar(inDetail);
  libShowToast(ids.length + ' image' + (ids.length > 1 ? 's' : '') + ' deleted', true);
  if (inDetail) renderFolderDetail(); else libRender();
}

// ── Undo ──
function libUndo() {
  if (!libState.undoData) return;
  const d = libState.undoData;
  if (d.type === 'move') {
    d.prevFolders.forEach(({ id, folderId }) => { const img = libState.images.find(i => i.id === id); if (img) img.folderId = folderId; });
    libShowToast('Move undone');
  } else if (d.type === 'delete') {
    d.images.forEach(img => { if (!libState.images.find(i => i.id === img.id)) libState.images.push(img); });
    libShowToast('Restored');
  }
  libState.undoData = null;
  if (libState.currentFolderId) renderFolderDetail(); else libRender();
}

// ── Toast ──
function libShowToast(msg, withUndo) {
  clearTimeout(libState.toastTimer);
  const toast = document.getElementById('lib-toast');
  const undo = document.getElementById('lib-toast-undo');
  document.getElementById('lib-toast-msg').textContent = msg;
  undo.style.display = withUndo && libState.undoData ? 'block' : 'none';
  toast.classList.add('on');
  libState.toastTimer = setTimeout(() => toast.classList.remove('on'), 4000);
}

// ── Share modal ──
function openShareModal() {
  document.getElementById('sm-overlay').style.display = 'block';
  document.getElementById('sm-modal').style.display = 'block';
  renderShareMembers();
}
function closeShareModal() {
  document.getElementById('sm-overlay').style.display = 'none';
  document.getElementById('sm-modal').style.display = 'none';
  document.getElementById('sm-access-dropdown').style.display = 'none';
}
function smCopyLink() {
  navigator.clipboard?.writeText(window.location.href + '#shared').catch(() => {});
  libShowToast('Link copied to clipboard');
}
function smToggleAccess() {
  const dd = document.getElementById('sm-access-dropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
function smSetAccess(level, el) {
  libState.shareAccessLevel = level;
  document.querySelectorAll('.sm-access-opt').forEach(o => {
    o.classList.remove('sm-access-selected');
    o.querySelector('.sm-opt-check')?.remove();
  });
  el.classList.add('sm-access-selected');
  el.innerHTML += '<svg class="sm-opt-check" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const labels = { restricted: 'Only people you add', workspace: 'Anyone in workspace', public: 'Public — anyone with link' };
  document.getElementById('sm-access-toggle').innerHTML = (labels[level] || 'can access') + ' <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 4l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  document.getElementById('sm-access-dropdown').style.display = 'none';
}
function smInvite() {
  const input = document.getElementById('sm-invite-input');
  const email = input.value.trim();
  if (!email || !email.includes('@')) { input.style.borderColor = '#dc2626'; return; }
  input.style.borderColor = '';
  if (!libState.shareMembers.find(m => m.email === email)) {
    libState.shareMembers.push({ avatar: email[0].toUpperCase(), name: '', email: email + ' (Invite sent)', role: 'can view', pending: true });
  }
  input.value = '';
  renderShareMembers();
  libShowToast('Invite sent to ' + email);
}
function smRemoveMember(email) {
  libState.shareMembers = libState.shareMembers.filter(m => !m.email.startsWith(email));
  renderShareMembers();
}
function renderShareMembers() {
  document.getElementById('sm-members').innerHTML = libState.shareMembers.map(m =>
    '<div class="sm-member-row">' +
    '<div class="sm-member-avatar' + (m.pending ? ' pending' : '') + '">' + m.avatar + '</div>' +
    '<div class="sm-member-info">' +
      (m.name ? '<div class="sm-member-name">' + m.name + '</div>' : '') +
      '<div class="sm-member-email">' + m.email + '</div>' +
    '</div>' +
    '<div class="sm-member-role">' + m.role + '</div>' +
    (m.role !== 'owner' ? '<button class="sm-member-remove" onclick="smRemoveMember(\'' + m.email.split(' ')[0] + '\')">×</button>' : '') +
    '</div>'
  ).join('');
}

// ── Upload / Create menu (main library topbar - no longer used for dropdown) ──
function toggleUploadMenu() {
  const menu = document.getElementById('lib-upload-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', function close(e) {
      if (!e.target.closest('.lib-upload-wrap')) { menu.style.display = 'none'; }
      document.removeEventListener('click', close);
    }), 10);
  }
}
function triggerFileUpload() {
  const menu = document.getElementById('lib-upload-menu');
  if (menu) menu.style.display = 'none';
  document.getElementById('lib-file-input').click();
}

// ── Upload menu in folder detail view ──
function toggleFdUploadMenu() {
  const menu = document.getElementById('fd-upload-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', function close(e) {
      if (!e.target.closest('.lib-upload-wrap')) { menu.style.display = 'none'; }
      document.removeEventListener('click', close);
    }), 10);
  }
}
function triggerFdFileUpload() {
  const menu = document.getElementById('fd-upload-menu');
  if (menu) menu.style.display = 'none';
  document.getElementById('fd-file-input').click();
}
function handleFileUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  files.forEach(file => {
    const src = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    libState.images.push({ id: 'up' + Date.now() + Math.random(), name, src, folderId: libState.currentFolderId || null, created: 'Just now', modified: 'Just now' });
  });
  input.value = '';
  libShowToast(files.length + ' image' + (files.length > 1 ? 's' : '') + ' uploaded');
  if (libState.currentFolderId) renderFolderDetail(); else libRender();
}
function chooseFromLibrary() {
  const libMenu = document.getElementById('lib-upload-menu');
  const fdMenu = document.getElementById('fd-upload-menu');
  if (libMenu) libMenu.style.display = 'none';
  if (fdMenu) fdMenu.style.display = 'none';
  libShowToast('Choose from library coming soon');
}

// ── Move button from canvas (wraps openFolderPicker) ──
function openFolderPickerFromCanvas() {
  // Select all canvas images as targets
  libState.ctxImageId = null;
  libState.selectedImages = new Set(['im1', 'im2', 'im3', 'im4']);
  openFolderPicker(false);
}

// Override the toolbar Move button behavior
document.addEventListener('DOMContentLoaded', function() {
  const moveBtn = document.getElementById('cvMoveBtn');
  if (moveBtn) moveBtn.onclick = openFolderPickerFromCanvas;
});

// ── PANEL RESIZE ──
(function() {
  const resizer = document.getElementById('panel-resizer');
  const leftPanel = document.querySelector('.left-panel');
  if (!resizer || !leftPanel) return;
  let startX, startW;
  resizer.addEventListener('mousedown', function(e) {
    startX = e.clientX;
    startW = leftPanel.offsetWidth;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    function onMove(e) {
      const delta = e.clientX - startX;
      const newW = Math.max(320, Math.min(startW + delta, window.innerWidth * 0.72));
      leftPanel.style.width = newW + 'px';
    }
    function onUp() {
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
})();

// ── NAV DRAWER ──
function openNavDrawer() {
  document.getElementById('nav-drawer').classList.add('open');
  document.getElementById('nav-backdrop').classList.add('open');
}
function closeNavDrawer() {
  document.getElementById('nav-drawer').classList.remove('open');
  document.getElementById('nav-backdrop').classList.remove('open');
}
function toggleNdDesigner() {
  const sub = document.getElementById('nd-designer-sub');
  const arrow = document.querySelector('.nd-designer-arrow');
  const item = document.getElementById('nd-designer-item');
  const isCollapsed = sub.classList.toggle('collapsed');
  arrow.classList.toggle('rotated', isCollapsed);
  item.classList.toggle('nd-expanded', !isCollapsed);
}

// ── RECOMMENDATION CARD SELECTION ──
function toggleRec(card) {
  card.classList.toggle('selected');
  const n = document.querySelectorAll('.rec-card.selected').length;
  const bar = document.getElementById('rec-bar');
  const count = document.getElementById('rec-bar-count');
  if (n === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'flex';
    count.textContent = n + ' selected';
  }
}

// ── PLAN COLLAPSE (still collapsible but stays in DOM) ──
document.getElementById('plan-header').addEventListener('click', function() {
  const body = document.getElementById('plan-body');
  const chevron = document.getElementById('plan-chevron');
  body.classList.toggle('collapsed');
  chevron.classList.toggle('open');
});

// ── WORKFLOW ROW EXPAND/COLLAPSE ──
function toggleWf(row) {
  const chevron = row.querySelector('.wf-chevron');
  const body = row.nextElementSibling;
  if (!body || !body.classList.contains('wf-body')) return;
  chevron.classList.toggle('open');
  body.classList.toggle('open');
}

// ── ACTION CARD SELECTION ──
function toggleAction(card) {
  card.classList.toggle('selected');
  updateExecuteButton();
}
function updateExecuteButton() {
  const selected = document.querySelectorAll('.action-card.selected').length;
  const btn = document.getElementById('execute-btn');
  if (selected === 0) {
    btn.classList.remove('visible');
    btn.textContent = 'Execute 1 Action';
  } else {
    btn.classList.add('visible');
    btn.textContent = `Execute ${selected} Action${selected > 1 ? 's' : ''}`;
  }
}

// ── CANVAS DOWNLOAD / SELECTION + CONTEXT STRIP ──
(function() {
  const dlBtn   = document.getElementById('cvDlBtn');
  const dlLabel = document.getElementById('cvDlLabel');
  const hint    = document.getElementById('cvHint');
  const toast   = document.getElementById('cvToast');
  const cards   = [0,1,2,3].map(i => document.getElementById('cv'+i));

  // Inner image chips row (inside composer-box)
  const imgRow = document.getElementById('inner-imgs-row');

  // Card metadata for chips
  const cardData = {
    cv0: { name: 'Product Shot',     color: 'linear-gradient(135deg,#1a5c3a,#237a4e)' },
    cv1: { name: 'Model Full',       color: 'linear-gradient(135deg,#0d4a32,#176040)' },
    cv2: { name: 'Close-up',         color: 'linear-gradient(135deg,#0a3d2c,#136042)' },
    cv3: { name: 'Product Variant',  color: 'linear-gradient(135deg,#1c5e3e,#2a7a52)' }
  };

  // ── Download mode state ──
  let mode = 'idle';
  const dlSel = new Set();
  let toastT = null;

  // ── Context selection state (shows chips in input box) ──
  const ctxSel = new Set();

  // ── Context strip helpers ──
  function rebuildStrip() {
    imgRow.innerHTML = '';
    ctxSel.forEach(id => {
      const d = cardData[id];
      const chip = document.createElement('div');
      chip.className = 'context-img-chip';
      chip.dataset.id = id;
      chip.innerHTML =
        '<div class="context-img-swatch" style="background:' + d.color + '"></div>' +
        '<span class="context-img-label">' + d.name + '</span>' +
        '<span class="context-img-remove" data-remove="' + id + '">' +
          '<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
        '</span>';
      imgRow.appendChild(chip);
    });
    if (ctxSel.size === 0) imgRow.classList.remove('has-imgs');
    else imgRow.classList.add('has-imgs');
  }

  // Delegate remove-chip clicks inside the strip
  imgRow.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const id = btn.dataset.remove;
    ctxSel.delete(id);
    const card = document.getElementById(id);
    if (card) card.classList.remove('cv-ctx-sel');
    rebuildStrip();
  });

  function toggleCtxCard(c) {
    const id = c.id;
    if (ctxSel.has(id)) {
      ctxSel.delete(id);
      c.classList.remove('cv-ctx-sel');
    } else {
      ctxSel.add(id);
      c.classList.add('cv-ctx-sel');
    }
    rebuildStrip();
  }

  // ── Download mode helpers ──
  function setIdle() {
    mode = 'idle';
    dlSel.clear();
    cards.forEach(c => c.classList.remove('cv-in-sel','cv-sel','cv-unsel'));
    dlBtn.className = 'cv-dl-btn';
    dlLabel.textContent = 'Download';
    hint.classList.remove('cv-on');
  }

  function setSelecting() {
    mode = 'selecting';
    dlSel.clear();
    cards.forEach(c => { c.classList.add('cv-in-sel','cv-unsel'); c.classList.remove('cv-sel'); });
    dlBtn.className = 'cv-dl-btn cv-cancel';
    dlLabel.textContent = 'Cancel';
    hint.classList.add('cv-on');
  }

  function updateDlBtn() {
    const n = dlSel.size;
    if (n === 0) {
      mode = 'selecting';
      dlBtn.className = 'cv-dl-btn cv-cancel';
      dlLabel.textContent = 'Cancel';
    } else {
      mode = 'has-sel';
      dlBtn.className = 'cv-dl-btn cv-has-sel';
      dlLabel.textContent = 'Download (' + n + ')';
    }
  }

  function toggleDlCard(c) {
    const id = c.id;
    if (dlSel.has(id)) {
      dlSel.delete(id);
      c.classList.remove('cv-sel');
      c.classList.add('cv-unsel');
    } else {
      dlSel.add(id);
      c.classList.add('cv-sel');
      c.classList.remove('cv-unsel');
    }
    updateDlBtn();
  }

  function showToast(msg) {
    if (toastT) clearTimeout(toastT);
    toast.textContent = msg;
    toast.classList.add('cv-on');
    toastT = setTimeout(() => toast.classList.remove('cv-on'), 2400);
  }

  // ── Download button ──
  dlBtn.addEventListener('click', () => {
    if (mode === 'idle') { setSelecting(); }
    else if (mode === 'selecting') { setIdle(); }
    else if (mode === 'has-sel') {
      const n = dlSel.size;
      showToast('Downloading ' + n + ' image' + (n > 1 ? 's' : '') + '…');
      setIdle();
    }
  });

  // ── Card click ──
  cards.forEach(c => c.addEventListener('click', () => {
    if (mode === 'selecting' || mode === 'has-sel') {
      // In download mode: toggle download selection only
      toggleDlCard(c);
    } else {
      // Normal mode: toggle context selection → shows chip in input box
      toggleCtxCard(c);
    }
  }));

  // ── Global clearSelection (called by strip's ✕ button) ──
  /** @type {any} */ (window).clearSelection = function() {
    ctxSel.clear();
    cards.forEach(c => c.classList.remove('cv-ctx-sel'));
    rebuildStrip();
  };
})();

// ── CONCEPT 4 — LIVE INPUT BINDING ──
const composer = document.getElementById('composer');
composer.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  const val = this.value.trim();
  const nameEl = document.getElementById('concept4-name');
  const summaryEl = document.getElementById('concept4-summary');
  if (nameEl && summaryEl) {
    if (val.length > 4) {
      nameEl.textContent = val.length > 32 ? val.slice(0, 32) + '…' : val;
      summaryEl.textContent = val;
      summaryEl.style.fontStyle = 'normal';
      summaryEl.style.color = 'var(--muted)';
    } else {
      nameEl.textContent = 'From your input';
      summaryEl.textContent = 'Type or paste your idea below to use it as Concept 4.';
      summaryEl.style.fontStyle = 'italic';
      summaryEl.style.color = 'var(--hint)';
    }
  }
});
function useInputConcept() {
  const val = composer.value.trim();
  if (!val) { composer.focus(); return; }
  const summaryEl = document.getElementById('concept4-summary');
  if (summaryEl) summaryEl.style.color = 'var(--green-text)';
}


// ── PLAN STEP UPDATER ──
const planStates = ['pending','pending','pending','pending','pending','pending'];
function setPlanStep(idx, state) {
  const el = document.getElementById('plan-' + idx);
  if (!el) return;
  el.className = 'plan-item ' + state;
  const iconEl = el.querySelector('.plan-step-icon');
  if (state === 'done') {
    iconEl.innerHTML = '<div class="plan-step-done"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#2D6A4F" stroke-width="1.3" stroke-linecap="round"/></svg></div>';
  } else if (state === 'active') {
    iconEl.innerHTML = '<div class="plan-step-spin"></div>';
  } else {
    iconEl.innerHTML = '<div class="plan-step-circle"></div>';
  }
}


// Status dot
function setStatusDot(state) {
  const dot = document.getElementById('status-dot');
  dot.className = 'status-dot ' + state;
}

// Completion: update left panel
setTimeout(() => {
  clearInterval(labelInterval);
  clearInterval(etaInterval);
  setStatusDot('done');

  // Fade out preview strip
  const strip = document.getElementById('preview-strip');
  if (strip) {
    strip.style.transition = 'opacity 0.4s ease';
    strip.style.opacity = 0;
    setTimeout(() => strip.style.display = 'none', 400);
  }

  // Show workflow groups
  setTimeout(() => {
    const groups = document.getElementById('workflow-groups');
    if (groups) { groups.style.display = 'flex'; groups.style.animation = 'fadeIn 0.25s ease'; }
  }, 200);

  // Show AI response
  setTimeout(() => {
    const aiResp = document.getElementById('ai-response');
    if (aiResp) { aiResp.style.display = 'flex'; aiResp.style.animation = 'fadeIn 0.25s ease'; }
  }, 650);

  // Show what next
  setTimeout(() => {
    const wn = document.getElementById('what-next');
    if (wn) {
      wn.style.display = 'flex';
      wn.style.animation = 'fadeIn 0.25s ease';
      setTimeout(() => {
        document.getElementById('panel-feed').scrollTo({ top: 9999, behavior: 'smooth' });
      }, 100);
    }
  }, 900);

}, 7200);

// Elapsed timer (Previews pill) + ETA countdown
(function() {
  var elapsed = document.getElementById('ip-elapsed');
  var eta     = document.getElementById('ip-eta');
  if (!elapsed || !eta) return;
  var elSecs  = 0;
  var etaSecs = 80; // ~1m 20s
  function fmt(s) { return s < 60 ? s + 's' : Math.floor(s/60) + 'm ' + (s%60) + 's'; }
  setInterval(function() {
    elSecs++;
    elapsed.textContent = fmt(elSecs);
    if (etaSecs > 0) { etaSecs--; eta.textContent = fmt(etaSecs); }
  }, 1000);
})();
