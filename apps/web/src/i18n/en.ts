export default {
  // Meta
  site_description: 'AI Accountability & Transparency Platform — Documenting AI model failures',

  // Nav
  nav_cases: 'Cases',
  nav_rankings: 'Rankings',
  nav_submit: 'Report',
  nav_lang_switch: '中文',

  // Footer
  footer_slogan: 'AI PRISON — Documenting every AI failure',

  // Home page
  home_classified: 'CLASSIFIED // INCIDENT ARCHIVE',
  home_subtitle: 'Documenting AI failures. Holding models accountable.',
  home_browse_cases: 'Browse Cases',
  home_report: 'Report Incident',
  home_latest: '▶ LATEST INCIDENTS',
  home_view_all: 'View all cases →',
  home_most_wanted: '▶ MOST WANTED',
  home_full_rankings: 'Full rankings →',

  // Cases list
  cases_title: '▶ INCIDENT DATABASE',
  cases_records: (n: number) => `${n} records`,
  cases_filter_model: 'All models',
  cases_filter_category: 'All types',
  cases_filter_severity: 'All severity',
  cases_filter_btn: 'Filter',
  cases_reset_btn: 'Reset',
  cases_empty: 'No cases found',

  // Case detail
  case_back: '← Back to cases',
  case_id_label: 'CASE ID',
  case_model_label: 'MODEL',
  case_date_label: 'DATE',
  case_category_label: 'CATEGORY',
  case_severity_label: 'SEVERITY',
  case_detail_label: 'INCIDENT DETAIL',
  case_source_label: 'SOURCE',
  case_date_locale: 'en-US',
  case_date_options: { year: 'numeric', month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions,

  // Rankings
  rankings_title: '☠ MOST WANTED',
  rankings_subtitle: 'Ranked by cumulative severity score',
  rankings_top_wanted: 'TOP WANTED',
  rankings_cases: 'Cases: ',
  rankings_severity: 'Severity: ',
  rankings_life: 'Life: ',
  rankings_avg_severity: 'Avg severity',

  // Submit
  submit_title: '▶ REPORT AN INCIDENT',
  submit_subtitle: 'Spotted an AI failure? Submit anonymously. Published after review.',

  // Submit form
  form_model_label: 'Model *',
  form_model_placeholder: 'Select model',
  form_title_zh_label: 'Title (Chinese) *',
  form_title_zh_placeholder: 'Brief title in Chinese',
  form_title_en_label: 'Title (English)',
  form_title_en_placeholder: 'English title (optional)',
  form_desc_zh_label: 'Description (Chinese) *',
  form_desc_zh_placeholder: 'Describe the incident in Chinese',
  form_desc_en_label: 'Description (English)',
  form_desc_en_placeholder: 'English description (optional)',
  form_category_label: 'Category *',
  form_category_placeholder: 'Select',
  form_severity_label: 'Severity *',
  form_severity_placeholder: 'Select',
  form_source_label: 'Source URL',
  form_submit_btn: 'Submit Case',
  form_submitting: 'Submitting...',
  form_footer: 'Anonymous · Published after review',
  form_error_prefix: 'Error: ',
  form_success_title: 'Case Submitted',
  form_success_desc: 'Pending review before publication.',
  form_success_btn: 'Submit another',

  // Severity labels
  severity_1: '⚠️ Warning',
  severity_2: '🔒 Detention',
  severity_3: '⛓️ Fixed Term',
  severity_4: '🔴 Heavy',
  severity_5: '☠️ Life',

  // Category labels
  category_hallucination: 'Hallucination',
  category_bias: 'Bias',
  category_safety: 'Safety Risk',
  category_privacy: 'Privacy Leak',
  category_other: 'Other',

  // Ranking table
  table_model: 'Model',
  table_cases: 'Cases',
  table_severity: 'Severity',
} as const
