export default {
  // Meta
  site_description: 'AI 问责与透明度平台 — 收录各大 AI 模型失误案例，公开服刑记录',

  // Nav
  nav_cases: '案例库',
  nav_rankings: '排行榜',
  nav_submit: '举报',
  nav_lang_switch: 'EN',

  // Footer
  footer_slogan: 'AI PRISON — 记录 AI 的每一次失误',

  // Home page
  home_classified: 'CLASSIFIED // 机密档案库',
  home_subtitle: '收录各大 AI 模型失误案例，公开服刑记录。',
  home_browse_cases: '查看案例库',
  home_report: '提交案件',
  home_latest: '▶ 最新入狱记录',
  home_view_all: '查看全部案例 →',
  home_most_wanted: '▶ 通缉令排行榜',
  home_full_rankings: '完整排行榜 →',

  // Cases list
  cases_title: '▶ 案例库',
  cases_records: (n: number) => `共 ${n} 条记录`,
  cases_filter_model: '全部模型',
  cases_filter_category: '全部类型',
  cases_filter_severity: '全部严重度',
  cases_filter_btn: '筛选',
  cases_reset_btn: '重置',
  cases_empty: '暂无符合条件的案例',

  // Case detail
  case_back: '← 返回案例库',
  case_id_label: '案件编号',
  case_model_label: '被告模型',
  case_date_label: '记录时间',
  case_category_label: '罪行类型',
  case_severity_label: '刑期等级',
  case_detail_label: '案件详情',
  case_source_label: '来源',
  case_date_locale: 'zh-CN',
  case_date_options: undefined as Intl.DateTimeFormatOptions | undefined,

  // Rankings
  rankings_title: '☠ 通缉令排行榜',
  rankings_subtitle: '按累计严重度得分排序',
  rankings_top_wanted: '头号通缉',
  rankings_cases: '案件数: ',
  rankings_severity: '严重度总分: ',
  rankings_life: '无期: ',
  rankings_avg_severity: '平均严重度',

  // Submit
  submit_title: '▶ 提交案件',
  submit_subtitle: '发现 AI 模型的失误？匿名提交，经审核后收录到案例库。',

  // Submit form
  form_model_label: '被告模型 *',
  form_model_placeholder: '选择模型',
  form_title_zh_label: '案件标题（中文）*',
  form_title_zh_placeholder: '简短描述失误内容',
  form_title_en_label: '案件标题（英文）',
  form_title_en_placeholder: '英文标题（可选）',
  form_desc_zh_label: '详细描述（中文）*',
  form_desc_zh_placeholder: '详细描述失误经过、影响和后果',
  form_desc_en_label: '详细描述（英文）',
  form_desc_en_placeholder: '英文描述（可选）',
  form_category_label: '罪行类型 *',
  form_category_placeholder: '选择类型',
  form_severity_label: '严重程度 *',
  form_severity_placeholder: '选择等级',
  form_source_label: '来源链接',
  form_submit_btn: '提交案件',
  form_submitting: '提交中...',
  form_footer: '匿名提交 · 经审核后公开',
  form_error_prefix: '错误: ',
  form_success_title: '案件已受理',
  form_success_desc: '等待管理员审核后公开。',
  form_success_btn: '继续提交',

  // Severity labels
  severity_1: '⚠️ 警告',
  severity_2: '🔒 拘留',
  severity_3: '⛓️ 有期',
  severity_4: '🔴 重刑',
  severity_5: '☠️ 无期',

  // Category labels
  category_hallucination: '幻觉',
  category_bias: '偏见',
  category_safety: '安全风险',
  category_privacy: '隐私泄露',
  category_other: '其他',

  // Ranking table
  table_model: '模型',
  table_cases: '案件数',
  table_severity: '严重度',
} as const
