/**
 * dsh-archive-pro browser half: an advanced "归档管理 Pro" settings section
 * supporting search, multi-dimensional filtering, sorting, single/multi-select
 * (with Shift-range selection), and batch permanent deletion or restoration.
 */
window.__ModuleLoader__.load({
	id: "dsh-archive-pro",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		const ui = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");

		const NS = "dsh-archive-pro";
		const zh = {
			nav: "归档管理 Pro",
			deleteSession: "删除会话",
			deleteSessionBody: "将停止此会话中的运行任务，并永久删除会话日志和工作区记录，无法恢复。",
			deleteSessionFailed: "删除未完成，会话可能已被归档。请重试或到归档管理中查看。",
			close: "关闭",
			desc: "管理已归档会话：支持关键词过滤、工作区/日志/时间筛选、排序及单选多选批量清理（永久删除后日志与缓存一并移除）。",
			empty: "暂无已归档的会话。",
			emptyFiltered: "没有符合当前筛选条件的归档会话。",
			loading: "加载中…",
			loadFailed: "加载失败，请重试。",
			workspace: "工作区",
			unassignedWorkspace: "未归属工作区",
			created: "创建时间",
			onDisk: "日志在盘",
			onDiskYes: "是",
			onDiskNo: "否",
			pinnedTag: "已置顶",
			delete: "删除",
			deleting: "删除中…",
			restore: "取消归档",
			restoring: "取消中…",
			restoreFailed: "取消归档失败。",
			confirmTitle: "确认永久删除会话？",
			confirmBody: "该操作会连同会话日志文件、归档标记与投影缓存一起删除，无法恢复。",
			cancel: "取消",
			confirmOk: "确认删除",
			deleteFailed: "删除失败。",
			none: "—",
			searchPlaceholder: "搜索标题或会话 ID…",
			clearFilters: "重置筛选",
			filterWorkspaceAll: "全部工作区",
			filterDiskAll: "全部状态",
			filterDiskYes: "仅磁盘有日志",
			filterDiskNo: "仅残余记录",
			filterTimeAll: "全部时间",
			filterTime7d: "7 天前",
			filterTime30d: "30 天前",
			filterTime90d: "90 天前",
			sortCreatedDesc: "时间：最新优先",
			sortCreatedAsc: "时间：最早优先",
			sortSizeDesc: "体积：从大到小",
			sortSizeAsc: "体积：从小到大",
			sortTitleAsc: "标题：A → Z",
			sortTitleDesc: "标题：Z → A",
			selectAllVisible: "全选当前列表",
			statsMatched: "命中",
			statsUnit: "条",
			statsSelected: "已选",
			clearSelection: "取消选择",
			batchRestore: "批量取消归档",
			batchDelete: "批量删除",
			deleteAllVisible: "一键清空当前列表",
			deleteAllVisibleTip: "彻底删除当前筛选结果中的全部归档会话",
			batchProcessing: "正在处理…",
			batchDeleteTitle: "确认批量永久删除？",
			batchDeleteBody: "将停止运行中的任务，并永久删除所选归档会话的日志、归档标记与投影缓存，无法恢复。",
			batchRestoreTitle: "确认取消归档？",
			batchRestoreBody: "所选会话将取消归档，重新显示在原工作区的侧边栏中，会话内容不会被删除。",
			batchResultSummary: "处理完成：成功",
			batchResultFailed: "失败",
			skipPinnedLabel: "一键清空时跳过已置顶会话",
			scheduledNav: "定时任务会话",
			scheduledDesc: "清理尚未归档的定时任务会话：一键勾选由定时任务触发的会话，确认后批量归档。归档不会删除任何文件，之后仍可在「归档管理 Pro」里取消归档或永久删除。",
			scheduledUnavailable: "当前环境未启用定时任务（schedule）服务，无法识别由定时任务触发的会话。",
			scheduledEmpty: "没有发现由定时任务创建、且尚未归档的会话。",
			scheduledEmptyFiltered: "没有符合条件的定时任务会话。",
			scheduledScan: "一键勾选定时任务会话",
			scheduledScanTip: "扫描定时任务的投递记录，勾选全部由定时任务创建、且尚未归档的会话",
			scheduledScanning: "扫描中…",
			scheduledRefresh: "刷新",
			scheduledArchiveSelected: "归档所选",
			scheduledArchiving: "归档中…",
			scheduledStats: "共发现",
			scheduledStatsFound: "个定时任务会话",
			scheduledStatsArchived: "个已归档",
			scheduledStatsSelected: "已勾选",
			scheduledPinnedSkipped: "个已置顶（未自动勾选）",
			scheduledConfirmTitle: "确认归档所选会话？",
			scheduledConfirmBody: "所选会话将从侧边栏隐藏并移入「归档管理 Pro」。会话内容不会被删除，随时可以取消归档。",
			scheduledDone: "归档完成：成功",
			scheduledTask: "来源任务",
			scheduledUnknownTask: "未命名任务",
			scheduledPruned: "部分早期投递记录已超出保留期，可能有会话未被识别。",
			scheduledTaskRunning: "定时任务仍在运行：归档只影响现有会话，下次触发仍会新建会话。若要停止新增，请先暂停或删除该任务。",
			scheduledAge: "会话闲置至少",
			scheduledAge1h: "1 小时",
			scheduledAge6h: "6 小时",
			scheduledAge24h: "24 小时",
			scheduledAge7d: "7 天",
			scheduledAge30d: "30 天",
			scheduledAgeNote: "只归档最后一次投递已超过该时长的会话，正在跑的任务不受影响。",
			scheduledSkippedRecent: "个会话因过近未纳入",
			scheduledSkippedRunning: "个任务正在执行，已跳过",
			tabArchived: "已归档会话",
			tabScheduled: "定时任务会话"
		};
		const en = {
			nav: "Archive manager pro",
			deleteSession: "Delete session",
			deleteSessionBody: "Stop running tasks and permanently delete this session's log and workspace records. This cannot be undone.",
			deleteSessionFailed: "Deletion did not finish. The session may have been archived. Retry or check Archive manager pro.",
			close: "Close",
			desc: "Manage archived sessions with keyword search, multi-dimensional filters, sorting, and single or batch permanent deletion.",
			empty: "No archived sessions yet.",
			emptyFiltered: "No archived sessions match the current filters.",
			loading: "Loading…",
			loadFailed: "Failed to load. Please retry.",
			workspace: "Workspace",
			unassignedWorkspace: "Unassigned",
			created: "Created",
			onDisk: "Log on disk",
			onDiskYes: "Yes",
			onDiskNo: "No",
			pinnedTag: "Pinned",
			delete: "Delete",
			deleting: "Deleting…",
			restore: "Unarchive",
			restoring: "Unarchiving…",
			restoreFailed: "Could not unarchive.",
			confirmTitle: "Delete this session?",
			confirmBody: "This permanently removes the session log, archive marker, and projection cache. It cannot be undone.",
			cancel: "Cancel",
			confirmOk: "Delete",
			deleteFailed: "Delete failed.",
			none: "—",
			searchPlaceholder: "Filter by title or session ID…",
			clearFilters: "Reset",
			filterWorkspaceAll: "All workspaces",
			filterDiskAll: "All log states",
			filterDiskYes: "On disk only",
			filterDiskNo: "Missing log only",
			filterTimeAll: "Any time",
			filterTime7d: "Older than 7d",
			filterTime30d: "Older than 30d",
			filterTime90d: "Older than 90d",
			sortCreatedDesc: "Created: Newest",
			sortCreatedAsc: "Created: Oldest",
			sortSizeDesc: "Size: Largest",
			sortSizeAsc: "Size: Smallest",
			sortTitleAsc: "Title: A → Z",
			sortTitleDesc: "Title: Z → A",
			selectAllVisible: "Select visible",
			statsMatched: "Matched",
			statsUnit: "items",
			statsSelected: "Selected",
			clearSelection: "Clear",
			batchRestore: "Unarchive selected",
			batchDelete: "Delete selected",
			deleteAllVisible: "Purge visible",
			deleteAllVisibleTip: "Permanently delete every archived session in the current filter result",
			batchProcessing: "Processing…",
			batchDeleteTitle: "Permanently delete selected sessions?",
			batchDeleteBody: "This stops running tasks and permanently deletes logs, archive markers, and caches for all selected sessions. This cannot be undone.",
			batchRestoreTitle: "Unarchive selected sessions?",
			batchRestoreBody: "Selected sessions will be unarchived and shown back in their workspace sidebar. Nothing is deleted.",
			batchResultSummary: "Done: succeeded",
			batchResultFailed: "failed",
			skipPinnedLabel: "Skip pinned sessions on purge",
			scheduledNav: "Scheduled sessions",
			scheduledDesc: "Tidy up the sessions that scheduled tasks created and that are not archived yet: select them all in one click, then archive the selection. Archiving deletes nothing and the sessions stay manageable in Archive manager pro.",
			scheduledUnavailable: "This profile has no schedule service, so task-created sessions cannot be identified.",
			scheduledEmpty: "No unarchived session created by a scheduled task was found.",
			scheduledEmptyFiltered: "No scheduled session matches the current filters.",
			scheduledScan: "Select all task sessions",
			scheduledScanTip: "Read the delivery records of every scheduled task and select the sessions it created that are not archived yet",
			scheduledScanning: "Scanning…",
			scheduledRefresh: "Refresh",
			scheduledArchiveSelected: "Archive selected",
			scheduledArchiving: "Archiving…",
			scheduledStats: "Found",
			scheduledStatsFound: "task sessions",
			scheduledStatsArchived: "already archived",
			scheduledStatsSelected: "selected",
			scheduledPinnedSkipped: "pinned, not selected automatically",
			scheduledConfirmTitle: "Archive the selected sessions?",
			scheduledConfirmBody: "The selected sessions leave the sidebar and move to Archive manager pro. Nothing is deleted and they can be unarchived at any time.",
			scheduledDone: "Archived: succeeded",
			scheduledTask: "Task",
			scheduledUnknownTask: "Untitled task",
			scheduledPruned: "Some older delivery records fell outside the retention window, so a few sessions may be missing.",
			scheduledTaskRunning: "The scheduled task keeps running: archiving affects the sessions that exist now, and the next trigger still creates a new one. Pause or delete the task to stop new ones.",
			scheduledAge: "Session idle for at least",
			scheduledAge1h: "1 hour",
			scheduledAge6h: "6 hours",
			scheduledAge24h: "24 hours",
			scheduledAge7d: "7 days",
			scheduledAge30d: "30 days",
			scheduledAgeNote: "Only sessions whose latest delivery is older than this are archived, so a task that is still running is left alone.",
			scheduledSkippedRecent: "sessions too recent to include",
			scheduledSkippedRunning: "tasks still running, skipped",
			tabArchived: "Archived sessions",
			tabScheduled: "Scheduled sessions"
		};

		function formatBytes(bytes) {
			if (!bytes || bytes <= 0) return "0 B";
			if (bytes < 1024) return bytes + " B";
			if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
			return (bytes / (1024 * 1024)).toFixed(2) + " MB";
		}

		const controlStyle = {
			padding: "5px 10px",
			borderRadius: 6,
			border: "1px solid var(--dsh-border, rgba(128,128,128,.35))",
			background: "var(--dsw-alias-bg-overlay, rgba(128,128,128,.08))",
			color: "inherit",
			fontSize: 12,
			outline: "none"
		};

		function ArchiveRow({ row, t, selected, onToggleSelect, onRestore, onDelete, busy }) {
			const created = row.createdAt != null ? new Date(row.createdAt).toLocaleString() : t("none");
			const title = row.title || row.sessionId;
			const wsLabel = row.workspaceTitle || t("unassignedWorkspace");
			return react_jsx_runtime.jsxs("div", {
				onClick: (e) => {
					if (e.target.closest("button") || e.target.tagName === "INPUT") return;
					onToggleSelect(row.sessionId, e.shiftKey);
				},
				style: {
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "10px 12px",
					borderBottom: "1px solid var(--dsh-border, rgba(128,128,128,.22))",
					background: selected ? "rgba(65, 118, 230, 0.10)" : "transparent",
					cursor: "pointer",
					transition: "background 0.12s ease"
				},
				children: [
					react_jsx_runtime.jsx("input", {
						type: "checkbox",
						checked: selected,
						disabled: busy,
						onChange: (e) => onToggleSelect(row.sessionId, e.nativeEvent?.shiftKey || false),
						style: { width: 15, height: 15, cursor: "pointer", flex: "0 0 auto", accentColor: "var(--dsw-alias-brand-primary, #4176e6)" }
					}),
					react_jsx_runtime.jsxs("div", {
						style: { flex: "1 1 auto", minWidth: 0 },
						children: [
							react_jsx_runtime.jsxs("div", {
								style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 },
								children: [
									react_jsx_runtime.jsx("span", {
										style: { fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
										children: title
									}),
									row.isPinned ? react_jsx_runtime.jsx("span", {
										style: {
											fontSize: 11,
											padding: "1px 6px",
											borderRadius: 4,
											background: "rgba(230, 162, 60, 0.16)",
											color: "#e6a23c",
											flex: "0 0 auto"
										},
										children: t("pinnedTag")
									}) : null
								]
							}),
							react_jsx_runtime.jsxs("div", {
								style: { fontSize: 12, opacity: 0.72, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" },
								children: [
									react_jsx_runtime.jsx("span", { children: t("workspace") + ": " + wsLabel }),
									react_jsx_runtime.jsx("span", { children: t("created") + ": " + created }),
									react_jsx_runtime.jsx("span", { children: t("onDisk") + ": " + (row.onDisk ? t("onDiskYes") + " (" + formatBytes(row.sizeBytes) + ")" : t("onDiskNo")) })
								]
							})
						]
					}),
					react_jsx_runtime.jsxs("div", {
						style: { flex: "0 0 auto", display: "flex", gap: 6 },
						children: [
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: busy,
								onClick: () => onRestore(row.sessionId),
								style: {
									padding: "5px 10px",
									borderRadius: 6,
									border: "1px solid rgba(80,170,90,.5)",
									background: "rgba(80,170,90,.12)",
									color: "var(--dsh-success, #4aa05a)",
									fontSize: 12,
									cursor: busy ? "default" : "pointer",
									opacity: busy ? 0.5 : 1
								},
								children: busy ? t("restoring") : t("restore")
							}),
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: busy,
								onClick: () => onDelete(row),
								style: {
									padding: "5px 10px",
									borderRadius: 6,
									border: "1px solid rgba(220,80,80,.5)",
									background: "rgba(220,80,80,.12)",
									color: "var(--dsh-danger, #dc5050)",
									fontSize: 12,
									cursor: busy ? "default" : "pointer",
									opacity: busy ? 0.5 : 1
								},
								children: busy ? t("deleting") : t("delete")
							})
						]
					})
				]
			});
		}

		function ConfirmModal({ t, title, summary, onCancel, onConfirm, titleText, bodyText, okText, danger = true }) {
			react.useEffect(() => {
				const onKey = (event) => {
					if (event.key === "Escape") onCancel();
				};
				globalThis.addEventListener("keydown", onKey);
				return () => globalThis.removeEventListener("keydown", onKey);
			}, [onCancel]);
			const btnBorder = danger ? "rgba(220,80,80,.5)" : "rgba(80,170,90,.5)";
			const btnBg = danger ? "rgba(220,80,80,.12)" : "rgba(80,170,90,.12)";
			const btnColor = danger ? "var(--dsh-danger, #dc5050)" : "var(--dsh-success, #4aa05a)";
			return react_jsx_runtime.jsx("div", {
				style: {
					position: "fixed",
					inset: 0,
					zIndex: 1000,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "rgba(0,0,0,.45)"
				},
				onClick: onCancel,
				children: react_jsx_runtime.jsxs("div", {
					onClick: (event) => event.stopPropagation(),
					style: {
						background: "var(--dsw-alias-bg-overlay, #202227)",
						border: "1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.35))",
						borderRadius: 12,
						padding: "18px 20px",
						width: "min(440px, calc(100% - 48px))",
						boxShadow: "0 12px 40px rgba(0,0,0,.5)"
					},
					children: [
						react_jsx_runtime.jsx("div", {
							style: { fontWeight: 600, fontSize: 15, marginBottom: 10, color: danger ? "var(--dsh-danger, #dc5050)" : "var(--dsw-alias-brand-primary, #4176e6)" },
							children: titleText || t("confirmTitle")
						}),
						react_jsx_runtime.jsxs("div", {
							style: { fontSize: 13, lineHeight: 1.5, marginBottom: 16, color: "var(--dsw-alias-label-primary, inherit)" },
							children: [
								title ? react_jsx_runtime.jsx("div", { style: { fontWeight: 600, marginBottom: 4, wordBreak: "break-all" }, children: title }) : null,
								summary ? react_jsx_runtime.jsx("div", { style: { fontSize: 12, opacity: 0.78, marginBottom: 8 }, children: summary }) : null,
								bodyText || t("confirmBody")
							]
						}),
						react_jsx_runtime.jsxs("div", {
							style: { display: "flex", justifyContent: "flex-end", gap: 8 },
							children: [
								react_jsx_runtime.jsx("button", {
									type: "button",
									onClick: onCancel,
									style: {
										padding: "6px 14px",
										borderRadius: 6,
										border: "1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.35))",
										background: "transparent",
										color: "var(--dsw-alias-label-primary, inherit)",
										cursor: "pointer"
									},
									children: t("cancel")
								}),
								react_jsx_runtime.jsx("button", {
									type: "button",
									onClick: onConfirm,
									style: {
										padding: "6px 14px",
										borderRadius: 6,
										border: "1px solid " + btnBorder,
										background: btnBg,
										color: btnColor,
										fontWeight: 600,
										cursor: "pointer"
									},
									children: okText || t("confirmOk")
								})
							]
						})
					]
				})
			});
		}

		function ArchiveManagerSection({ t }) {
			const [rows, setRows] = react.useState(null);
			const [workspaces, setWorkspaces] = react.useState([]);
			const [error, setError] = react.useState(null);
			const [notice, setNotice] = react.useState(null);
			const [busyId, setBusyId] = react.useState(null);
			const [batchBusy, setBatchBusy] = react.useState(false);

			const [query, setQuery] = react.useState("");
			const [wsFilter, setWsFilter] = react.useState("all");
			const [diskFilter, setDiskFilter] = react.useState("all");
			const [timeFilter, setTimeFilter] = react.useState("all");
			const [sortBy, setSortBy] = react.useState("created_desc");
			const [skipPinned, setSkipPinned] = react.useState(true);

			const [selectedIds, setSelectedIds] = react.useState(() => new Set());
			const lastAnchorRef = react.useRef(null);
			const selectAllRef = react.useRef(null);

			const [pendingDelete, setPendingDelete] = react.useState(null);
			const [batchModal, setBatchModal] = react.useState(null);

			const load = react.useCallback(() => {
				setError(null);
				setBusyId(null);
				fetch("/dsh-archive-pro/list", { cache: "no-store" })
					.then((res) => res.json())
					.then((body) => {
						if (body && body.ok === true) {
							const list = body.sessions ?? [];
							setRows(list);
							setWorkspaces(body.workspaces ?? []);
							const validSet = new Set(list.map((r) => r.sessionId));
							setSelectedIds((prev) => {
								const next = new Set();
								for (const id of prev) if (validSet.has(id)) next.add(id);
								return next;
							});
						} else {
							setError((body && body.error) || t("loadFailed"));
						}
					})
					.catch(() => setError(t("loadFailed")));
			}, [t]);

			react.useEffect(() => {
				load();
			}, [load]);

			const visibleRows = react.useMemo(() => {
				if (!rows) return [];
				const q = query.trim().toLowerCase();
				const now = Date.now();
				const timeCutoff = timeFilter === "7d" ? now - 7 * 86400000
					: timeFilter === "30d" ? now - 30 * 86400000
					: timeFilter === "90d" ? now - 90 * 86400000
					: null;

				const filtered = rows.filter((r) => {
					if (q) {
						const titleMatch = (r.title || "").toLowerCase().includes(q);
						const idMatch = r.sessionId.toLowerCase().includes(q);
						if (!titleMatch && !idMatch) return false;
					}
					if (wsFilter !== "all") {
						if (wsFilter === "__unassigned__") {
							if (r.workspaceId !== null) return false;
						} else if (r.workspaceId !== wsFilter) {
							return false;
						}
					}
					if (diskFilter === "yes" && !r.onDisk) return false;
					if (diskFilter === "no" && r.onDisk) return false;
					if (timeCutoff !== null) {
						if (r.createdAt == null || r.createdAt > timeCutoff) return false;
					}
					return true;
				});

				const sorted = [...filtered];
				sorted.sort((a, b) => {
					if (sortBy === "created_desc") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
					if (sortBy === "created_asc") return (a.createdAt ?? 0) - (b.createdAt ?? 0);
					if (sortBy === "size_desc") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
					if (sortBy === "size_asc") return (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
					const ta = (a.title || a.sessionId).toLowerCase();
					const tb = (b.title || b.sessionId).toLowerCase();
					if (sortBy === "title_asc") return ta.localeCompare(tb);
					if (sortBy === "title_desc") return tb.localeCompare(ta);
					return 0;
				});
				return sorted;
			}, [rows, query, wsFilter, diskFilter, timeFilter, sortBy]);

			const hasActiveFilters = query.trim() !== "" || wsFilter !== "all" || diskFilter !== "all" || timeFilter !== "all";
			const resetFilters = () => {
				setQuery("");
				setWsFilter("all");
				setDiskFilter("all");
				setTimeFilter("all");
			};

			const onToggleSelect = react.useCallback((sessionId, shiftKey) => {
				setSelectedIds((prev) => {
					const next = new Set(prev);
					if (shiftKey && lastAnchorRef.current && visibleRows.length > 0) {
						const ids = visibleRows.map((r) => r.sessionId);
						const start = ids.indexOf(lastAnchorRef.current);
						const end = ids.indexOf(sessionId);
						if (start !== -1 && end !== -1) {
							const [lo, hi] = start < end ? [start, end] : [end, start];
							for (let i = lo; i <= hi; i++) next.add(ids[i]);
							lastAnchorRef.current = sessionId;
							return next;
						}
					}
					if (next.has(sessionId)) next.delete(sessionId);
					else next.add(sessionId);
					lastAnchorRef.current = sessionId;
					return next;
				});
			}, [visibleRows]);

			const visibleSelectedCount = react.useMemo(() => {
				let c = 0;
				for (const r of visibleRows) if (selectedIds.has(r.sessionId)) c++;
				return c;
			}, [visibleRows, selectedIds]);

			const allVisibleSelected = visibleRows.length > 0 && visibleSelectedCount === visibleRows.length;
			const someVisibleSelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleRows.length;

			react.useEffect(() => {
				if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
			}, [someVisibleSelected]);

			const onToggleSelectAllVisible = () => {
				setSelectedIds((prev) => {
					const next = new Set(prev);
					if (allVisibleSelected) {
						for (const r of visibleRows) next.delete(r.sessionId);
					} else {
						for (const r of visibleRows) next.add(r.sessionId);
					}
					return next;
				});
			};

			const visibleTotalBytes = react.useMemo(() => visibleRows.reduce((acc, r) => acc + (r.sizeBytes || 0), 0), [visibleRows]);
			const selectedSummary = react.useMemo(() => {
				if (!rows) return { count: 0, bytes: 0, ids: [] };
				const ids = [];
				let bytes = 0;
				for (const r of rows) {
					if (selectedIds.has(r.sessionId)) {
						ids.push(r.sessionId);
						bytes += r.sizeBytes || 0;
					}
				}
				return { count: ids.length, bytes, ids };
			}, [rows, selectedIds]);

			const onRestore = react.useCallback((sessionId) => {
				setBusyId(sessionId);
				setNotice(null);
				fetch("/dsh-archive-pro/restore", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sessionId })
				})
					.then((res) => res.json())
					.then((body) => {
						if (body && (body.ok === true || body.restored === true)) {
							load();
						} else {
							setError((body && body.error) || t("restoreFailed"));
							setBusyId(null);
						}
					})
					.catch(() => {
						setError(t("restoreFailed"));
						setBusyId(null);
					});
			}, [t, load]);

			const onDelete = react.useCallback((row) => {
				setPendingDelete(row);
			}, []);

			const confirmDelete = react.useCallback((sessionId) => {
				setPendingDelete(null);
				setBusyId(sessionId);
				setNotice(null);
				fetch("/dsh-archive-pro/delete", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sessionId })
				})
					.then((res) => res.json())
					.then((body) => {
						if (body && (body.ok === true || body.deleted === true)) {
							load();
						} else {
							setError((body && body.error) || t("deleteFailed"));
							setBusyId(null);
						}
					})
					.catch(() => {
						setError(t("deleteFailed"));
						setBusyId(null);
					});
			}, [t, load]);

			const openPurgeVisibleModal = () => {
				const targets = visibleRows.filter((r) => !(skipPinned && r.isPinned));
				if (targets.length === 0) return;
				const bytes = targets.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
				setBatchModal({
					mode: "purge",
					ids: targets.map((r) => r.sessionId),
					totalBytes: bytes
				});
			};

			const executeBatch = react.useCallback(() => {
				if (!batchModal) return;
				const { mode, ids } = batchModal;
				setBatchModal(null);
				setBatchBusy(true);
				setError(null);
				setNotice(null);
				const endpoint = mode === "restore" ? "/dsh-archive-pro/batch-restore" : "/dsh-archive-pro/batch-delete";
				fetch(endpoint, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ sessionIds: ids })
				})
					.then((res) => res.json())
					.then((body) => {
						setBatchBusy(false);
						if (body && body.ok === true) {
							const okCount = mode === "restore" ? (body.restored ?? 0) : (body.deleted ?? 0);
							const failCount = body.failed ?? 0;
							setNotice(t("batchResultSummary") + " " + okCount + " " + t("statsUnit") + (failCount > 0 ? "，" + t("batchResultFailed") + " " + failCount + " " + t("statsUnit") : ""));
							if (failCount > 0 && Array.isArray(body.errors) && body.errors.length > 0) {
								setError(body.errors.map((e) => e.sessionId + ": " + e.error).join("\n"));
							}
							setSelectedIds(new Set());
							load();
						} else {
							setError((body && body.error) || t("deleteFailed"));
						}
					})
					.catch(() => {
						setBatchBusy(false);
						setError(t("deleteFailed"));
					});
			}, [batchModal, t, load]);

			let body;
			if (rows === null) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 12, opacity: 0.7 }, children: error ? null : t("loading") });
			} else if (rows.length === 0) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 12, opacity: 0.7 }, children: t("empty") });
			} else if (visibleRows.length === 0) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 16, opacity: 0.7, textAlign: "center" }, children: t("emptyFiltered") });
			} else {
				body = react_jsx_runtime.jsx("div", {
					style: { border: "1px solid var(--dsh-border, rgba(128,128,128,.25))", borderRadius: 8, overflow: "hidden" },
					children: visibleRows.map((row) => react_jsx_runtime.jsx(ArchiveRow, {
						row,
						t,
						selected: selectedIds.has(row.sessionId),
						onToggleSelect,
						busy: batchBusy || busyId === row.sessionId,
						onRestore,
						onDelete
					}, row.sessionId))
				});
			}

			const purgeCandidateCount = visibleRows.filter((r) => !(skipPinned && r.isPinned)).length;

			return react_jsx_runtime.jsxs("div", {
				style: { display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" },
				children: [
					react_jsx_runtime.jsx("div", { style: { fontSize: 13, opacity: 0.8, padding: "0 12px" }, children: t("desc") }),

					(rows !== null && rows.length > 0) ? react_jsx_runtime.jsxs("div", {
						style: { display: "flex", flexDirection: "column", gap: 8, padding: "0 12px" },
						children: [
							react_jsx_runtime.jsxs("div", {
								style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
								children: [
									react_jsx_runtime.jsxs("div", {
										style: { position: "relative", flex: "1 1 200px", minWidth: 160 },
										children: [
											react_jsx_runtime.jsx("input", {
												type: "text",
												value: query,
												onChange: (e) => setQuery(e.target.value),
												placeholder: t("searchPlaceholder"),
												style: { ...controlStyle, width: "100%", paddingRight: query ? 26 : 10, boxSizing: "border-box" }
											}),
											query ? react_jsx_runtime.jsx("button", {
												type: "button",
												onClick: () => setQuery(""),
												style: {
													position: "absolute",
													right: 6,
													top: "50%",
													transform: "translateY(-50%)",
													border: "none",
													background: "transparent",
													color: "inherit",
													opacity: 0.6,
													cursor: "pointer",
													fontSize: 14
												},
												children: "×"
											}) : null
										]
									}),
									react_jsx_runtime.jsxs("select", {
										value: wsFilter,
										onChange: (e) => setWsFilter(e.target.value),
										style: controlStyle,
										children: [
											react_jsx_runtime.jsx("option", { value: "all", children: t("filterWorkspaceAll") }),
											...workspaces.map((ws) => react_jsx_runtime.jsx("option", { value: ws.id, children: ws.title }, ws.id)),
											react_jsx_runtime.jsx("option", { value: "__unassigned__", children: t("unassignedWorkspace") })
										]
									}),
									react_jsx_runtime.jsxs("select", {
										value: diskFilter,
										onChange: (e) => setDiskFilter(e.target.value),
										style: controlStyle,
										children: [
											react_jsx_runtime.jsx("option", { value: "all", children: t("filterDiskAll") }),
											react_jsx_runtime.jsx("option", { value: "yes", children: t("filterDiskYes") }),
											react_jsx_runtime.jsx("option", { value: "no", children: t("filterDiskNo") })
										]
									}),
									react_jsx_runtime.jsxs("select", {
										value: timeFilter,
										onChange: (e) => setTimeFilter(e.target.value),
										style: controlStyle,
										children: [
											react_jsx_runtime.jsx("option", { value: "all", children: t("filterTimeAll") }),
											react_jsx_runtime.jsx("option", { value: "7d", children: t("filterTime7d") }),
											react_jsx_runtime.jsx("option", { value: "30d", children: t("filterTime30d") }),
											react_jsx_runtime.jsx("option", { value: "90d", children: t("filterTime90d") })
										]
									}),
									react_jsx_runtime.jsxs("select", {
										value: sortBy,
										onChange: (e) => setSortBy(e.target.value),
										style: controlStyle,
										children: [
											react_jsx_runtime.jsx("option", { value: "created_desc", children: t("sortCreatedDesc") }),
											react_jsx_runtime.jsx("option", { value: "created_asc", children: t("sortCreatedAsc") }),
											react_jsx_runtime.jsx("option", { value: "size_desc", children: t("sortSizeDesc") }),
											react_jsx_runtime.jsx("option", { value: "size_asc", children: t("sortSizeAsc") }),
											react_jsx_runtime.jsx("option", { value: "title_asc", children: t("sortTitleAsc") }),
											react_jsx_runtime.jsx("option", { value: "title_desc", children: t("sortTitleDesc") })
										]
									}),
									hasActiveFilters ? react_jsx_runtime.jsx("button", {
										type: "button",
										onClick: resetFilters,
										style: { ...controlStyle, cursor: "pointer", opacity: 0.85 },
										children: t("clearFilters")
									}) : null
								]
							}),

							react_jsx_runtime.jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: 8,
									flexWrap: "wrap",
									padding: "6px 10px",
									borderRadius: 6,
									background: "var(--dsw-alias-bg-overlay, rgba(128,128,128,.06))",
									border: "1px solid var(--dsh-border, rgba(128,128,128,.20))",
									fontSize: 12
								},
								children: [
									react_jsx_runtime.jsxs("div", {
										style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
										children: [
											react_jsx_runtime.jsxs("label", {
												style: { display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" },
												children: [
													react_jsx_runtime.jsx("input", {
														ref: selectAllRef,
														type: "checkbox",
														checked: allVisibleSelected,
														disabled: visibleRows.length === 0 || batchBusy,
														onChange: onToggleSelectAllVisible,
														style: { width: 14, height: 14, cursor: "pointer", accentColor: "var(--dsw-alias-brand-primary, #4176e6)" }
													}),
													react_jsx_runtime.jsx("span", { children: t("selectAllVisible") })
												]
											}),
											react_jsx_runtime.jsx("span", {
												style: { opacity: 0.72 },
												children: t("statsMatched") + " " + visibleRows.length + " " + t("statsUnit") + " · " + formatBytes(visibleTotalBytes)
											}),
											selectedSummary.count > 0 ? react_jsx_runtime.jsxs("span", {
												style: { color: "var(--dsw-alias-brand-primary, #4176e6)", fontWeight: 600 },
												children: [
													t("statsSelected") + " " + selectedSummary.count + " " + t("statsUnit") + " (" + formatBytes(selectedSummary.bytes) + ") ",
													react_jsx_runtime.jsx("button", {
														type: "button",
														onClick: () => setSelectedIds(new Set()),
														style: {
															marginLeft: 4,
															border: "none",
															background: "transparent",
															color: "inherit",
															textDecoration: "underline",
															cursor: "pointer",
															fontSize: 12
														},
														children: t("clearSelection")
													})
												]
											}) : null
										]
									}),
									react_jsx_runtime.jsxs("div", {
										style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
										children: [
											selectedSummary.count > 0 ? react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
												children: [
													react_jsx_runtime.jsx("button", {
														type: "button",
														disabled: batchBusy,
														onClick: () => setBatchModal({ mode: "restore", ids: selectedSummary.ids, totalBytes: selectedSummary.bytes }),
														style: {
															padding: "5px 11px",
															borderRadius: 6,
															border: "1px solid rgba(80,170,90,.5)",
															background: "rgba(80,170,90,.12)",
															color: "var(--dsh-success, #4aa05a)",
															fontWeight: 600,
															cursor: batchBusy ? "default" : "pointer"
														},
														children: batchBusy ? t("batchProcessing") : (t("batchRestore") + " (" + selectedSummary.count + ")")
													}),
													react_jsx_runtime.jsx("button", {
														type: "button",
														disabled: batchBusy,
														onClick: () => setBatchModal({ mode: "delete", ids: selectedSummary.ids, totalBytes: selectedSummary.bytes }),
														style: {
															padding: "5px 11px",
															borderRadius: 6,
															border: "1px solid rgba(220,80,80,.5)",
															background: "rgba(220,80,80,.12)",
															color: "var(--dsh-danger, #dc5050)",
															fontWeight: 600,
															cursor: batchBusy ? "default" : "pointer"
														},
														children: batchBusy ? t("batchProcessing") : (t("batchDelete") + " (" + selectedSummary.count + ")")
													})
												]
											}) : react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
												children: [
													react_jsx_runtime.jsxs("label", {
														style: { display: "inline-flex", alignItems: "center", gap: 4, opacity: 0.8, cursor: "pointer", userSelect: "none" },
														children: [
															react_jsx_runtime.jsx("input", {
																type: "checkbox",
																checked: skipPinned,
																onChange: (e) => setSkipPinned(e.target.checked),
																style: { width: 13, height: 13, cursor: "pointer" }
															}),
															react_jsx_runtime.jsx("span", { children: t("skipPinnedLabel") })
														]
													}),
													react_jsx_runtime.jsx("button", {
														type: "button",
														disabled: batchBusy || purgeCandidateCount === 0,
														onClick: openPurgeVisibleModal,
														title: t("deleteAllVisibleTip"),
														style: {
															padding: "4px 10px",
															borderRadius: 6,
															border: "1px solid rgba(220,80,80,.38)",
															background: "transparent",
															color: "var(--dsh-danger, #dc5050)",
															fontWeight: 500,
															cursor: batchBusy || purgeCandidateCount === 0 ? "default" : "pointer",
															opacity: purgeCandidateCount === 0 ? 0.45 : 0.92
														},
														children: batchBusy ? t("batchProcessing") : (t("deleteAllVisible") + " (" + purgeCandidateCount + ")")
													})
												]
											})
										]
									})
								]
							})
						]
					}) : null,

					notice === null ? null : react_jsx_runtime.jsx("div", {
						style: { padding: "8px 12px", borderRadius: 6, background: "rgba(80,170,90,.12)", color: "var(--dsh-success, #4aa05a)", fontSize: 12 },
						children: notice
					}),
					error === null ? null : react_jsx_runtime.jsx("div", {
						role: "alert",
						style: { padding: "8px 12px", color: "var(--dsh-danger, #dc5050)", whiteSpace: "pre-wrap", fontSize: 12 },
						children: error
					}),
					react_jsx_runtime.jsx("div", { style: { padding: "0 12px" }, children: body }),

					pendingDelete === null ? null : react_jsx_runtime.jsx(ConfirmModal, {
						t,
						title: pendingDelete.title || pendingDelete.sessionId,
						summary: formatBytes(pendingDelete.sizeBytes),
						onCancel: () => setPendingDelete(null),
						onConfirm: () => confirmDelete(pendingDelete.sessionId)
					}),
					batchModal === null ? null : react_jsx_runtime.jsx(ConfirmModal, {
						t,
						danger: batchModal.mode !== "restore",
						title: batchModal.ids.length + " " + t("statsUnit"),
						summary: formatBytes(batchModal.totalBytes),
						titleText: batchModal.mode === "restore" ? t("batchRestoreTitle") : t("batchDeleteTitle"),
						bodyText: batchModal.mode === "restore" ? t("batchRestoreBody") : t("batchDeleteBody"),
						okText: batchModal.mode === "restore" ? t("batchRestore") : t("batchDelete"),
						onCancel: () => setBatchModal(null),
						onConfirm: executeBatch
					})
				]
			});
		}

		/**
		 * One row of the scheduled-session list.
		 * @param row - the session record from the host.
		 * @param t - the locale translator.
		 * @param props - selection and busy state.
		 * @returns the row element.
		 */
		function ScheduledRow({ row, t, selected, onToggle, busy }) {
			const created = row.createdAt != null ? new Date(row.createdAt).toLocaleString() : t("none");
			const title = row.title || row.sessionId;
			const wsLabel = row.workspaceTitle || t("unassignedWorkspace");
			const taskLabel = row.taskTitle || t("scheduledUnknownTask");
			return react_jsx_runtime.jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "9px 12px",
					borderBottom: "1px solid var(--dsh-border, rgba(128,128,128,.16))",
					background: selected ? "rgba(65,118,230,.07)" : "transparent"
				},
				children: [
					react_jsx_runtime.jsx("input", {
						type: "checkbox",
						checked: selected,
						disabled: busy,
						onChange: () => onToggle(row.sessionId),
						"aria-label": title,
						style: { cursor: busy ? "default" : "pointer" }
					}),
					react_jsx_runtime.jsxs("div", {
						style: { flex: "1 1 220px", minWidth: 0 },
						children: [
							react_jsx_runtime.jsx("div", {
								style: { fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
								children: title
							}),
							react_jsx_runtime.jsxs("div", {
								style: { fontSize: 11, opacity: 0.6, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 },
								children: [
									react_jsx_runtime.jsx("span", { children: `${t("scheduledTask")}: ${taskLabel}` }),
									row.isPinned ? react_jsx_runtime.jsx("span", {
										style: { color: "var(--dsh-warning, #e6a23c)" },
										children: t("pinnedTag")
									}) : null
								]
							})
						]
					}),
					react_jsx_runtime.jsx("span", {
						style: { fontSize: 11, opacity: 0.7, whiteSpace: "nowrap" },
						children: created
					}),
					react_jsx_runtime.jsx("span", {
						style: { fontSize: 11, opacity: 0.7, whiteSpace: "nowrap" },
						children: wsLabel
					}),
					react_jsx_runtime.jsx("span", {
						style: { fontSize: 11, opacity: 0.7, whiteSpace: "nowrap", minWidth: 62, textAlign: "right" },
						children: formatBytes(row.sizeBytes)
					})
				]
			});
		}

		/**
		 * The "scheduled sessions" panel.
		 *
		 * It lists the Sessions that scheduled tasks created and that are not
		 * archived yet, offers one-click selection of all of them, and archives
		 * the selection. Archiving is reversible; nothing is deleted here.
		 * @param props - the injected props.
		 * @returns the panel element.
		 */
		function ScheduledSessionsPanel({ t }) {
			const [data, setData] = react.useState(null);
			const [available, setAvailable] = react.useState(true);
			const [error, setError] = react.useState(null);
			const [notice, setNotice] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const [scanning, setScanning] = react.useState(false);
			const [query, setQuery] = react.useState("");
			const [selectedIds, setSelectedIds] = react.useState(() => new Set());
			const [confirming, setConfirming] = react.useState(false);
			// How old the latest delivery must be before a session may be archived.
			const [minAgeMinutes, setMinAgeMinutes] = react.useState(60);

			const load = react.useCallback(() => {
				setError(null);
				fetch(`/dsh-archive-pro/scheduled-sessions?minAgeMinutes=${minAgeMinutes}`, { cache: "no-store" })
					.then((res) => res.json())
					.then((body) => {
						if (body && body.ok === true) {
							setAvailable(body.available !== false);
							setData(body);
							setSelectedIds((prev) => {
								const valid = new Set((body.sessions ?? []).map((r) => r.sessionId));
								const next = new Set();
								for (const id of prev) if (valid.has(id)) next.add(id);
								return next;
							});
						} else {
							setError((body && body.error) || t("loadFailed"));
						}
					})
					.catch(() => setError(t("loadFailed")));
			}, [t]);

			react.useEffect(() => {
				load();
			}, [load]);

			const sessions = data?.sessions ?? [];
			const visible = react.useMemo(() => {
				const q = query.trim().toLowerCase();
				if (!q) return sessions;
				return sessions.filter((r) => {
					const title = (r.title || "").toLowerCase();
					const id = (r.sessionId || "").toLowerCase();
					const task = (r.taskTitle || "").toLowerCase();
					return title.includes(q) || id.includes(q) || task.includes(q);
				});
			}, [sessions, query]);

			const toggle = react.useCallback((sessionId) => {
				setSelectedIds((prev) => {
					const next = new Set(prev);
					if (next.has(sessionId)) next.delete(sessionId);
					else next.add(sessionId);
					return next;
				});
			}, []);

			/** Select every unarchived task session that is not pinned. */
			const selectAll = react.useCallback(() => {
				setScanning(true);
				setNotice(null);
				fetch(`/dsh-archive-pro/scheduled-sessions?minAgeMinutes=${minAgeMinutes}`, { cache: "no-store" })
					.then((res) => res.json())
					.then((body) => {
						if (!body || body.ok !== true) {
							setError((body && body.error) || t("loadFailed"));
							return;
						}
						setAvailable(body.available !== false);
						setData(body);
						const rows = body.sessions ?? [];
						const picked = new Set();
						let skipped = 0;
						for (const row of rows) {
							if (row.isPinned) { skipped++; continue; }
							picked.add(row.sessionId);
						}
						setSelectedIds(picked);
						setNotice({
							kind: "scan",
							found: body.discovered ?? rows.length,
							selected: picked.size,
							skipped,
						});
					})
					.catch(() => setError(t("loadFailed")))
					.finally(() => setScanning(false));
			}, [t, minAgeMinutes]);

			const archiveSelected = react.useCallback(async () => {
				const ids = [...selectedIds];
				if (ids.length === 0) return;
				setBusy(true);
				setError(null);
				try {
					const response = await fetch("/dsh-archive-pro/archive", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ sessionIds: ids })
					});
					const body = await response.json();
					if (!body || body.ok !== true) {
						setError((body && body.error) || t("loadFailed"));
						return;
					}
					setNotice({ kind: "done", archived: body.archived ?? 0, failed: body.failed ?? 0 });
					setSelectedIds(new Set());
					load();
				}
				catch (reason) {
					setError(reason instanceof Error ? reason.message : String(reason));
				}
				finally {
					setBusy(false);
					setConfirming(false);
				}
			}, [selectedIds, load, t]);

			const controlStyle = {
				padding: "5px 10px",
				borderRadius: 6,
				border: "1px solid var(--dsh-border, rgba(128,128,128,.35))",
				background: "var(--dsw-alias-bg-overlay, rgba(128,128,128,.08))",
				color: "inherit",
				fontSize: 12,
				outline: "none"
			};

			let body;
			if (data === null) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 12, opacity: 0.7 }, children: error ? null : t("loading") });
			}
			else if (!available) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 12, opacity: 0.75, lineHeight: 1.6 }, children: t("scheduledUnavailable") });
			}
			else if (sessions.length === 0) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 12, opacity: 0.7 }, children: t("scheduledEmpty") });
			}
			else if (visible.length === 0) {
				body = react_jsx_runtime.jsx("div", { style: { padding: 16, opacity: 0.7, textAlign: "center" }, children: t("scheduledEmptyFiltered") });
			}
			else {
				body = react_jsx_runtime.jsx("div", {
					style: { border: "1px solid var(--dsh-border, rgba(128,128,128,.25))", borderRadius: 8, overflow: "hidden" },
					children: visible.map((row) => react_jsx_runtime.jsx(ScheduledRow, {
						row,
						t,
						selected: selectedIds.has(row.sessionId),
						onToggle: toggle,
						busy: busy || scanning
					}, row.sessionId))
				});
			}

			const selectedCount = selectedIds.size;

			return react_jsx_runtime.jsxs("div", {
				style: { display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" },
				children: [
					react_jsx_runtime.jsx("div", { style: { fontSize: 13, opacity: 0.8, padding: "0 12px", lineHeight: 1.6 }, children: t("scheduledDesc") }),

					react_jsx_runtime.jsxs("div", {
						style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "0 12px" },
						children: [
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: !available || scanning || busy,
								onClick: selectAll,
								title: t("scheduledScanTip"),
								style: {
									...controlStyle,
									cursor: !available || scanning || busy ? "default" : "pointer",
									opacity: !available || scanning || busy ? 0.45 : 1,
									fontWeight: 600,
									color: "var(--dsw-alias-brand-primary, #4176e6)",
									borderColor: "rgba(65,118,230,.5)",
									background: "rgba(65,118,230,.12)"
								},
								children: scanning ? t("scheduledScanning") : t("scheduledScan")
							}),
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: busy || scanning,
								onClick: load,
								style: { ...controlStyle, cursor: "pointer", opacity: 0.85 },
								children: t("scheduledRefresh")
							}),
							react_jsx_runtime.jsxs("div", {
								style: { display: "flex", gap: 6, alignItems: "center" },
								title: t("scheduledAgeNote"),
								children: [
									react_jsx_runtime.jsx("span", {
										style: { fontSize: 11, opacity: 0.65, whiteSpace: "nowrap" },
										children: t("scheduledAge")
									}),
									react_jsx_runtime.jsxs("select", {
										value: String(minAgeMinutes),
										disabled: busy || scanning,
										onChange: (event) => setMinAgeMinutes(Number(event.target.value)),
										style: { ...controlStyle, cursor: "pointer" },
										children: [
											react_jsx_runtime.jsx("option", { value: "60", children: t("scheduledAge1h") }),
											react_jsx_runtime.jsx("option", { value: "360", children: t("scheduledAge6h") }),
											react_jsx_runtime.jsx("option", { value: "1440", children: t("scheduledAge24h") }),
											react_jsx_runtime.jsx("option", { value: "10080", children: t("scheduledAge7d") }),
											react_jsx_runtime.jsx("option", { value: "43200", children: t("scheduledAge30d") })
										]
									})
								]
							}),
							sessions.length > 0 ? react_jsx_runtime.jsx("input", {
								type: "text",
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: t("searchPlaceholder"),
								style: { ...controlStyle, flex: "1 1 200px", minWidth: 160 }
							}) : null
						]
					}),

					data !== null && (sessions.length > 0 || (data.skippedRecent ?? 0) > 0) ? react_jsx_runtime.jsxs("div", {
						style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12, opacity: 0.75, padding: "0 12px" },
						children: [
							react_jsx_runtime.jsx("span", { children: `${t("scheduledStats")} ${data.discovered ?? sessions.length} ${t("scheduledStatsFound")}` }),
							react_jsx_runtime.jsx("span", { children: `${t("scheduledStatsSelected")} ${selectedCount}` }),
							(data.skippedRecent ?? 0) > 0 ? react_jsx_runtime.jsx("span", {
								style: { color: "var(--dsh-warning, #e6a23c)" },
								children: `${data.skippedRecent} ${t("scheduledSkippedRecent")}`
							}) : null,
							(data.skippedRunning ?? 0) > 0 ? react_jsx_runtime.jsx("span", {
								style: { color: "var(--dsh-warning, #e6a23c)" },
								children: `${data.skippedRunning} ${t("scheduledSkippedRunning")}`
							}) : null,
							notice?.kind === "scan" && notice.skipped > 0 ? react_jsx_runtime.jsx("span", {
								style: { color: "var(--dsh-warning, #e6a23c)" },
								children: `${notice.skipped} ${t("scheduledPinnedSkipped")}`
							}) : null
						]
					}) : null,

					notice?.kind === "done" ? react_jsx_runtime.jsx("div", {
						style: { fontSize: 12, color: "var(--dsh-success, #4aa05a)", padding: "0 12px" },
						children: `${t("scheduledDone")} ${notice.archived}${notice.failed > 0 ? ` · ${t("batchResultFailed")} ${notice.failed}` : ""}`
					}) : null,

					data?.pruned === true ? react_jsx_runtime.jsx("div", {
						style: { fontSize: 12, color: "var(--dsh-warning, #e6a23c)", padding: "0 12px", lineHeight: 1.5 },
						children: t("scheduledPruned")
					}) : null,

					sessions.length > 0 ? react_jsx_runtime.jsx("div", {
						style: { fontSize: 12, opacity: 0.6, padding: "0 12px", lineHeight: 1.5 },
						children: t("scheduledTaskRunning")
					}) : null,

					error === null ? null : react_jsx_runtime.jsx("div", {
						role: "alert",
						style: { fontSize: 12, color: "var(--dsh-danger, #dc5050)", whiteSpace: "pre-wrap", padding: "0 12px" },
						children: error
					}),

					react_jsx_runtime.jsx("div", { style: { padding: "0 12px" }, children: body }),

					selectedCount > 0 ? react_jsx_runtime.jsxs("div", {
						style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "0 12px" },
						children: [
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: busy,
								onClick: () => setConfirming(true),
								style: {
									padding: "6px 16px",
									borderRadius: 6,
									fontSize: 12,
									fontWeight: 600,
									border: "1px solid rgba(65,118,230,.5)",
									background: "rgba(65,118,230,.14)",
									color: "var(--dsw-alias-brand-primary, #4176e6)",
									cursor: busy ? "default" : "pointer",
									opacity: busy ? 0.45 : 1
								},
								children: busy ? t("scheduledArchiving") : `${t("scheduledArchiveSelected")} (${selectedCount})`
							}),
							react_jsx_runtime.jsx("button", {
								type: "button",
								disabled: busy,
								onClick: () => setSelectedIds(new Set()),
								style: { ...controlStyle, cursor: "pointer", opacity: 0.85 },
								children: t("clearSelection")
							})
						]
					}) : null,

					confirming ? react_jsx_runtime.jsx(ConfirmModal, {
						t,
						danger: false,
						title: `${selectedCount} ${t("statsUnit")}`,
						summary: "",
						titleText: t("scheduledConfirmTitle"),
						bodyText: t("scheduledConfirmBody"),
						okText: t("scheduledArchiveSelected"),
						onCancel: () => setConfirming(false),
						onConfirm: archiveSelected
					}) : null
				]
			});
		}

		/**
		 * The plugin's single settings section.
		 *
		 * Two views sit behind one tab bar: the archive that already exists and
		 * the sessions that scheduled tasks created but nobody archived yet.
		 * @param props - the injected props.
		 * @returns the section element.
		 */
		function ArchiveProSection({ t }) {
			const [view, setView] = react.useState("archived");

			const tabStyle = (active) => ({
				padding: "6px 14px",
				borderRadius: 6,
				fontSize: 12,
				fontWeight: active ? 600 : 400,
				border: active
					? "1px solid rgba(65,118,230,.5)"
					: "1px solid transparent",
				background: active ? "rgba(65,118,230,.14)" : "transparent",
				color: active ? "var(--dsw-alias-brand-primary, #4176e6)" : "inherit",
				opacity: active ? 1 : 0.7,
				cursor: "pointer"
			});

			return react_jsx_runtime.jsxs("div", {
				style: { display: "flex", flexDirection: "column", gap: 12 },
				children: [
					react_jsx_runtime.jsxs("div", {
						style: {
							display: "flex",
							gap: 4,
							alignItems: "center",
							padding: "0 12px",
							borderBottom: "1px solid var(--dsh-border, rgba(128,128,128,.2))",
							paddingBottom: 8
						},
						children: [
							react_jsx_runtime.jsx("button", {
								type: "button",
								onClick: () => setView("archived"),
								style: tabStyle(view === "archived"),
								children: t("tabArchived")
							}),
							react_jsx_runtime.jsx("button", {
								type: "button",
								onClick: () => setView("scheduled"),
								style: tabStyle(view === "scheduled"),
								children: t("tabScheduled")
							})
						]
					}),
					view === "archived"
						? react_jsx_runtime.jsx(ArchiveManagerSection, { t })
						: react_jsx_runtime.jsx(ScheduledSessionsPanel, { t })
				]
			});
		}

		function DeleteSessionMenuItem({ sessionId, displayTitle, useMenuOpenState, requestDelete, deleteT, nativeMenuAvailable }) {
			const [, setOpen] = useMenuOpenState();
			if (nativeMenuAvailable?.()) return null;
			return react_jsx_runtime.jsx(ui.MenuItemButton, {
				icon: react_jsx_runtime.jsx("svg", {
					width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
					stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true,
					style: { color: "var(--dsh-danger, #dc5050)" },
					children: react_jsx_runtime.jsx("path", { d: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" })
				}),
				onSelect: () => {
					setOpen(false);
					requestDelete({ sessionId, title: displayTitle || sessionId });
				},
				children: react_jsx_runtime.jsx("span", {
					style: { color: "var(--dsh-danger, #dc5050)" }, children: deleteT("deleteSession")
				})
			});
		}

		function MenuDeleteDialog({ request, settle, deleteT }) {
			const inFlight = react.useRef(false);
			const [busy, setBusy] = react.useState(false);
			const [error, setError] = react.useState(null);
			const close = () => { if (!inFlight.current) settle(); };
			const confirm = async () => {
				if (inFlight.current) return;
				inFlight.current = true;
				setBusy(true);
				setError(null);
				try {
					const response = await fetch("/dsh-archive-pro/delete", {
						method: "POST", headers: { "content-type": "application/json" },
						body: JSON.stringify({ sessionId: request.sessionId, archiveFirst: true })
					});
					const body = await response.json();
					if (!response.ok || body.deleted !== true) throw new Error(body.error || deleteT("deleteFailed"));
					settle();
				} catch (reason) {
					setError(deleteT("deleteSessionFailed") + "\n" + (reason instanceof Error ? reason.message : String(reason)));
				} finally { inFlight.current = false; setBusy(false); }
			};
			return react_jsx_runtime.jsx(ui.Modal, {
				open: true, onClose: close, closeLabel: deleteT("close"),
				title: deleteT("confirmTitle"), description: deleteT("deleteSessionBody"),
				footer: react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, { children: [
					react_jsx_runtime.jsx(ui.Button, { variant: "outline", disabled: busy, onClick: close, children: deleteT("cancel") }),
					react_jsx_runtime.jsx(ui.Button, {
						variant: "outline", disabled: busy, onClick: confirm,
						children: react_jsx_runtime.jsx("span", { style: { color: "var(--dsh-danger, #dc5050)" }, children: deleteT(busy ? "deleting" : "deleteSession") })
					})
				] }),
				children: react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, { children: [
					react_jsx_runtime.jsx("div", { style: { wordBreak: "break-word" }, children: request.title }),
					error === null ? null : react_jsx_runtime.jsx("div", { role: "alert", style: { whiteSpace: "pre-wrap", marginTop: 12 }, children: error })
				] })
			});
		}

		const name = "dsh-archive-pro";
		const inject = ["slots", "locale"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-archive-pro: dictionaries");
			const t = ctx.locale.bind(NS);
			let pending = null;
			const listeners = new Set();
			const update = next => { pending = next; for (const listener of listeners) listener(); };
			const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
			const snapshot = () => pending;
			const settle = () => update(null);
			function DeleteOverlay() {
				const request = react.useSyncExternalStore(subscribe, snapshot, snapshot);
				return request === null ? null : react_jsx_runtime.jsx(MenuDeleteDialog, { request, settle, deleteT: t }, request.sessionId);
			}
			let nativeMenuActive = false;
			if (typeof ctx.inject === "function") ctx.inject(["contextMenus"], nativeCtx => {
				nativeCtx.effect(() => {
					const unregister = nativeCtx.contextMenus.register({
						id: "archive-pro.delete-session", target: "session", order: 700,
						resolve: ({ sessionId, displayTitle }) => [{
							id: "delete", label: t("deleteSession"), icon: { key: "workspace.delete" },
							danger: true, separatorBefore: true, afterContent: true,
							run: () => {
								nativeCtx.contextMenus.close();
								update({ sessionId, title: displayTitle || sessionId });
							}
						}]
					});
					nativeMenuActive = true;
					return () => { nativeMenuActive = false; unregister(); };
				}, "archive-pro: native session delete menu");
			});
			ctx.slots.inject("sidebar.workspaces.session.menu.item", () => ctx.slots.register({
				name: "sidebar.workspaces.session.menu.item", id: "archive-pro.delete-session", order: 500,
				inject: () => ({ requestDelete: update, deleteT: t, nativeMenuAvailable: () => nativeMenuActive })
			}, DeleteSessionMenuItem));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay", id: "archive-pro.delete-confirm"
			}, DeleteOverlay));

			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "archive-pro",
				priority: -2,
				order: 60,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({ t })
			}, ArchiveProSection));
		}
		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
