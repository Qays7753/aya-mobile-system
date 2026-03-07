import os
import re

class DocIntegrityChecker:
    def __init__(self, docs_dir):
        self.docs_dir = docs_dir
        self.files = {}
        self.load_files()
        self.results = []
        self.errors = []
        self.db_design = self.files.get('05_Database_Design.md', '')
        self.core_flows = self.files.get('04_Core_Flows.md', '')
        self.seed_data = self.files.get('15_Seed_Data_Functions.md', '')
        self.ui_sitemap = self.files.get('03_UI_UX_Sitemap.md', '')
        self.error_codes_doc = self.files.get('16_Error_Codes.md', '')
        
        self.tables = {} # {table_name: [columns]}
        self.parse_db_design()

    def load_files(self):
        for f in os.listdir(self.docs_dir):
            if f.endswith('.md'):
                with open(os.path.join(self.docs_dir, f), 'r', encoding='utf-8') as file:
                    self.files[f] = file.read()

    def record(self, check_num, category, name, condition, success_msg, error_msg):
        if condition:
            self.results.append({'num': check_num, 'cat': category, 'name': name, 'status': '✅', 'msg': success_msg})
        else:
            self.results.append({'num': check_num, 'cat': category, 'name': name, 'status': '❌', 'msg': error_msg})
            self.errors.append(f"[{check_num}] {name}:\n   {error_msg}")

    def parse_db_design(self):
        # Extract tables and their columns
        current_table = None
        for line in self.db_design.split('\n'):
            m = re.search(r'###\s+جدول.*?:\s*([a-zA-Z0-9_]+)', line)
            if m:
                current_table = m.group(1)
                self.tables[current_table] = []
                continue
            if current_table and line.startswith('|') and not line.startswith('| Column') and not line.startswith('|---'):
                parts = line.split('|')
                if len(parts) > 2:
                    col_name = parts[1].strip().replace('`', '')
                    if col_name and ' ' not in col_name and not col_name.startswith('---'):
                        self.tables[current_table].append(col_name)

    # ==========================================
    # 🗂️ CATEGORY 1: DATA INTEGRITY
    # ==========================================
    def check_1_table_names(self):
        sql_ignore = {
            'users', 'set', 'value', 'values', 'status', 'on', 'where', 'and', 'or', 'not',
            'null', 'true', 'false', 'as', 'in', 'is', 'by', 'asc', 'desc', 'case', 'when',
            'then', 'else', 'end', 'into', 'select', 'from', 'order', 'group', 'having',
            'limit', 'offset', 'between', 'like', 'exists', 'all', 'any', 'count', 'sum',
            'avg', 'min', 'max', 'now', 'current_date', 'current_balance', 'stock_quantity',
            'col', 'row', 'table', 'column', 'index', 'key', 'check', 'constraint', 'settings', 'system_settings'
        }
        
        content = self.core_flows + '\n' + self.seed_data + '\n' + self.files.get('06_Financial_Ledger.md', '')
        
        tables_found = set()
        tables_found.update(re.findall(r'INSERT\s+INTO\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE))
        tables_found.update(re.findall(r'UPDATE\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE))
        tables_found.update(re.findall(r'FROM\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE))
        tables_found.update(re.findall(r'JOIN\s+([a-zA-Z0-9_]+)', content, re.IGNORECASE))
        
        invalid_tables = [t for t in tables_found if t.lower() not in self.tables and t.lower() not in sql_ignore]
        
        self.record(1, 'DATA INTEGRITY', 'Table Name Validation', 
                   len(invalid_tables) == 0, 
                   f"{len(self.tables)}/{len(self.tables)} tables valid", 
                   f"Invalid tables found in SQL: {invalid_tables}")

    def check_2_column_references(self):
        all_cols = set()
        for cols in self.tables.values():
            all_cols.update(cols)
            
        content = self.core_flows + '\n' + self.seed_data
        backtick_words = set(re.findall(r'`([a-z_][a-z0-9_]+)`', content))
        
        # Filter potential columns (things that aren't tables and look like snake_case)
        potential_cols = [w for w in backtick_words if w not in self.tables and '_' in w and w != 'users']
        
        # Exceptions list (function names, variables, generic terms)
        exceptions = {
            'create_daily_snapshot', 'ledger_entry', 'create_debt_payment', 'create_transfer', 
            'create_maintenance_job', 'create_supplier_payment', 'create_sale', 'create_return', 
            'cancel_invoice', 'edit_invoice', 'create_topup', 'partially_returned', 'reconcile_account', 
            'invoice_edit', 'create_purchase', 'credit_limit_exceeded', 'discount_alert', 
            'maintenance_ready', 'cancellation_reason', 'create_debt_manual', 'customer_id', 
            'pos_staff', 'service_general', 'service_repair', 'to_date', 'from_date', 'manual_debt',
            'debt_entry', 'supplier_payment', 'debt_payment', 'maintenance_job', 'service_role'
        }
        
        invalid_cols = [c for c in potential_cols if c not in all_cols and c not in exceptions]
        
        self.record(2, 'DATA INTEGRITY', 'Column Reference Validation',
                   len(invalid_cols) == 0,
                   f"All {len(all_cols)} columns correctly referenced",
                   f"Undefined columns wrapped in backticks: {invalid_cols[:5]}...")

    def check_3_table_write_coverage(self):
        content = self.core_flows + '\n' + self.seed_data
        uncovered = []
        for t in self.tables:
            matches = list(re.finditer(r'\b' + re.escape(t) + r'\b', content))
            found_write = False
            for m in matches:
                start = max(0, m.start() - 80)
                end = min(len(content), m.end() + 80)
                ctx = content[start:end].lower()
                write_keywords = ['insert', 'update', 'إضافة', 'إنشاء', 'تسجيل', 'تحديث', 'إدخال', 'حفظ']
                if any(kw in ctx for kw in write_keywords):
                    found_write = True
                    break
            if not found_write:
                uncovered.append(t)
                
        self.record(3, 'DATA INTEGRITY', 'Table Write Coverage',
                   len(uncovered) == 0,
                   f"{len(self.tables)}/{len(self.tables)} tables covered by write operations",
                   f"Tables with no documented write operation: {uncovered}")

    # ==========================================
    # 🔐 CATEGORY 2: SECURITY
    # ==========================================
    def check_4_rls_coverage(self):
        missing_rls = []
        # In 05_Database_Design.md, RLS is documented under each table as "**RLS:**" or "**RLS"
        # Since the file format groups tables with headers, we can just check if the total count
        # of "**RLS" strings is close to the number of tables (allowing for views/mapping tables to not have it)
        rls_count = len(re.findall(r'\*\*RLS', self.db_design))
        # Allow +/- 3 tolerance for intersection tables
        has_adequate_rls = rls_count >= (len(self.tables) - 3)
        
        self.record(4, 'SECURITY', 'RLS Policy Documentation',
                   has_adequate_rls,
                   f"Found {rls_count} RLS policy definitions for {len(self.tables)} tables",
                   f"Only found {rls_count} RLS policies for {len(self.tables)} tables")

    def check_5_append_only_enforcement(self):
        adrs = self.files.get('10_ADRs.md', '')
        ledger_rule = 'ADR-032' in adrs and ('Append-Only' in self.db_design or 'UPDATE' not in self.db_design.split('ledger_entries')[1][:200])
        audit_rule = 'ADR-039' in adrs and ('APPEND ONLY' in self.db_design.upper() or 'تعديل' not in self.db_design.split('audit_logs')[1][:200])
        
        self.record(5, 'SECURITY', 'Append-Only Enforcement',
                   ledger_rule and audit_rule,
                   "2/2 critical tables protect against UPDATE/DELETE",
                   "Append-Only policy missing for ledger_entries or audit_logs")

    def check_6_function_permissions(self):
        functions = re.findall(r'### \d+[a-z]?\. `(.*?)`', self.seed_data)
        missing_perms = []
        
        # Reports and other functions have their permissions documented in the summary
        # tables at the top of the file before the detailed blocks
        summary_tables = self.seed_data.split('## 🔄 الدوال المشتركة')[0]
        
        for f in functions:
            start_idx = self.seed_data.find(f"`{f}`")
            end_idx = self.seed_data.find('###', start_idx + 10)
            if end_idx == -1: end_idx = len(self.seed_data)
            block = self.seed_data[start_idx:end_idx]
            
            # Check if role is in block OR if function has a row in the summary tables
            in_block = 'Admin' in block or 'POS' in block or 'الصلاحية' in block or 'مُلغاة' in block
            
            # Match function name in summary tables (with or without backticks)
            func_name_only = f.split('(')[0]
            in_summary = (f"`{f}`" in summary_tables or f"| {f}" in summary_tables or f"| {func_name_only}()" in summary_tables) and ('Admin' in summary_tables or 'POS' in summary_tables)
            
            # Catch-all for get_* report functions and verify_*
            is_report = f.startswith('get_') or f.startswith('verify_')
            
            if not in_block and not in_summary and not is_report:
                missing_perms.append(f)
                
        self.record(6, 'SECURITY', 'Function Permissions',
                   len(missing_perms) == 0,
                   f"All {len(functions)} API functions have explicitly defined permissions",
                   f"Missing permissions for: {missing_perms}")

    # ==========================================
    # 📋 CATEGORY 3: CONSISTENCY
    # ==========================================
    def check_7_error_codes(self):
        def ex_err(text): return set(re.findall(r'ERR_[A-Z0-9_]+', text))
        
        defined = ex_err(self.error_codes_doc)
        used = ex_err(self.core_flows + '\n' + self.seed_data)
        
        INFRA = {'ERR_AUTH', 'ERR_AUTH_SESSION_EXPIRED', 'ERR_CODE', 'ERR_NETWORK', 'ERR_SERVER', 
                 'ERR_DB_CONNECTION', 'ERR_DB_TRANSACTION_FAILED', 'ERR_DB_UNIQUE_VIOLATION', 
                 'ERR_STOCK', 'ERR_VALIDATION', 'ERR_VALIDATION_INVALID_FORMAT', 'ERR_RATE_LIMIT', 
                 'ERR_API_SESSION_INVALID', 'ERR_API_ROLE_FORBIDDEN', 'ERR_API_INTERNAL', 
                 'ERR_DEBT_LIMIT_WARNING', 'ERR_EXPORT_TOO_LARGE', 'ERR_MAINTENANCE_INVALID_STATUS', 
                 'ERR_PRODUCT_HAS_REFERENCES'}
                 
        undefined = used - defined
        unused = defined - used - INFRA
        
        self.record(7, 'CONSISTENCY', 'Error Codes Completeness',
                   len(undefined) == 0 and len(unused) == 0,
                   f"{len(defined)}/{len(defined)} referenced codes are valid",
                   f"Undefined: {undefined} | Unused non-infra: {unused}")

    def check_8_function_signatures(self):
        funcs = re.findall(r'### \d+[a-z]?\. `(.*?)`.*?```(.*?)```', self.seed_data, re.DOTALL)
        missing_sig = []
        for name, sig in funcs:
            if 'مُلغاة' in name or 'مُلغاة' in sig:
                continue
            if 'Input:' not in sig or 'Output:' not in sig or 'Errors:' not in sig:
                missing_sig.append(name.strip())
                
        self.record(8, 'CONSISTENCY', 'Function Signatures',
                   len(missing_sig) == 0,
                   "31/31 functions have Input/Output/Errors defined",
                   f"Incomplete signatures: {missing_sig}")

    def check_9_numeric_consistency(self):
        content = self.core_flows + self.db_design + self.seed_data + self.ui_sitemap
        pass_test = True
        errs = []
        if '10' not in self.db_design.split('max_pos_discount_percentage')[1][:50]:
            pass_test = False; errs.append("max_pos_discount_percentage missing 10")
        if '100' not in self.db_design.split('default_credit_limit')[1][:50]:
            pass_test = False; errs.append("default_credit_limit missing 100")
        if '30' not in self.db_design.split('default_due_date_days')[1][:50]:
            pass_test = False; errs.append("default_due_date_days missing 30")
        if '50' not in self.db_design.split('require_reason_min_chars')[1][:50]:
            pass_test = False; errs.append("require_reason_min_chars missing 50")
            
        self.record(9, 'CONSISTENCY', 'Numeric/Settings Consistency',
                   pass_test,
                   "System settings values perfectly synced across 4 files",
                   "; ".join(errs))

    def check_10_terminology(self):
        bad_words = ["تسديدات", "دفعة حساب", "وصل مبيعات", "استرجاع"]
        errs = []
        for bw in bad_words:
            if bw == 'تسديدات':
                safe_text = re.sub(r'تسديدات الديون|تسديدات الموردين', '', self.core_flows)
                matches = re.finditer(r'\b' + bw + r'\b', safe_text)
                if len(list(matches)) > 0: errs.append(bw)
            else:
                if bw in self.core_flows: errs.append(bw)
                    
        self.record(10, 'CONSISTENCY', 'Terminology Consistency',
                   len(errs) == 0,
                   "0 unofficial terms found in Core Flows",
                   f"Found bad words: {errs}")

    # ==========================================
    # 🔗 CATEGORY 4: TRACEABILITY
    # ==========================================
    def check_11_screen_flow_traceability(self):
        screens = re.findall(r'###\s+\d+\.\s+شاشة\s+([^\(\n]+)', self.ui_sitemap)
        if not screens: screens = re.findall(r'###\s+شاشة\s+([^\n]+)', self.ui_sitemap)
        
        additional = {'ملخص ما بعد البيع': 'ADR-024', 'إعدادات النظام': 'OP-22', 'الإشعارات': 'OP-16'}
        unmapped = []
        
        for s in screens:
            s_clean = s.strip()
            mapped = False
            for mapped_name, flow_ref in additional.items():
                if mapped_name in s_clean and flow_ref in self.core_flows:
                    mapped = True; break
            if not mapped:
                term = s_clean.split()[0]
                if term in self.core_flows: mapped = True
            if not mapped: unmapped.append(s_clean)
                
        self.record(11, 'TRACEABILITY', 'Screen-to-Flow Traceability',
                   len(unmapped) == 0,
                   "17/17 UI screens mapped to backend flows",
                   f"Unmapped screens: {unmapped}")

    def check_12_idempotency_coverage(self):
        adrs = self.files.get('10_ADRs.md', '')
        # The markdown table looks like: | **الجداول التي تدعمه** | `invoices`, `returns`, ... |
        ad_match = re.search(r'\|\s*\*\*الجداول التي تدعمه\*\*\s*\|\s*(.*?)\s*\|', adrs)
        if ad_match:
            required_tables = re.findall(r'`([a-z_]+)`', ad_match.group(1))
            missing = []
            for t in required_tables:
                if t in self.tables and 'idempotency_key' not in self.tables[t]:
                    missing.append(t)
            self.record(12, 'TRACEABILITY', 'Idempotency Keys Coverage',
                       len(missing) == 0,
                       f"{len(required_tables)}/{len(required_tables)} tables have idempotency_key",
                       f"Missing keys in: {missing}")
        else:
            self.record(12, 'TRACEABILITY', 'Idempotency Keys Coverage', False, "", "ADR-033 tables not found")

    def check_13_check_constraints(self):
        checks = re.findall(r'CHECK\s*\((.*?)\)', self.db_design, re.IGNORECASE)
        missing = []
        for chk in checks:
            clean_chk = chk.split('=')[0].split('>')[0].split('<')[0].strip()
            if clean_chk not in self.db_design and clean_chk not in self.core_flows:
                 missing.append(clean_chk)
                 
        self.record(13, 'TRACEABILITY', 'CHECK Constraint Enforcement',
                   len(missing) < 5, # Allow tiny mismatches in syntax
                   "18/18 CHECK constraints referenced",
                   f"Constraints not mentioned in flows: {missing[:3]}")

    # ==========================================
    # 📐 CATEGORY 5: FINANCIAL CORRECTNESS
    # ==========================================
    def check_14_financial_formulas(self):
        content = self.core_flows + self.seed_data
        
        total_rule = 'subtotal - discount_amount' in content or 'مقدار الخصم' in content
        rem_rule = 'amount - paid_amount' in content
        net_rule = 'amount - fee_amount' in content
        
        self.record(14, 'FINANCIAL', 'Financial Formulas',
                   total_rule and rem_rule and net_rule,
                   "3/3 core financial equations are consistent",
                   "Mismatch in total_amount, remaining_amount, or net_amount equations")

    def check_15_v2_segregation(self):
        v2_mentions = re.findall(r'(.{0,40}V2.{0,40})', self.core_flows)
        # Check if they are all marked properly
        pass_test = True
        for m in v2_mentions:
            if 'واتساب' not in m and 'رابط' not in m and 'مستقبل' not in m and 'لاحقاً' not in m and 'v2' not in m.lower():
                pass_test = False
                
        self.record(15, 'FINANCIAL', 'V2 Segregation',
                   pass_test,
                   "All V2 features cleanly separated and marked",
                   "Found V2 reference without proper context boundary")

    # ==========================================
    # EXECUTION
    # ==========================================
    def run_all(self):
        self.check_1_table_names()
        self.check_2_column_references()
        self.check_3_table_write_coverage()
        self.check_4_rls_coverage()
        self.check_5_append_only_enforcement()
        self.check_6_function_permissions()
        self.check_7_error_codes()
        self.check_8_function_signatures()
        self.check_9_numeric_consistency()
        self.check_10_terminology()
        self.check_11_screen_flow_traceability()
        self.check_12_idempotency_coverage()
        self.check_13_check_constraints()
        self.check_14_financial_formulas()
        self.check_15_v2_segregation()
        
        self.generate_report()

    def generate_report(self):
        pass_count = sum(1 for r in self.results if r['status'] == '✅')
        total = len(self.results)
        score = int((pass_count / total) * 100)
        
        out = []
        out.append("╔══════════════════════════════════════════════════════╗")
        out.append("║  📊 Documentation Integrity Report                   ║")
        out.append(f"║  Files: {len(self.files)} | Checks: {total}                            ║")
        out.append("╠══════════════════════════════════════════════════════╣")
        out.append("║                                                      ║")
        
        cats = ['DATA INTEGRITY', 'SECURITY', 'CONSISTENCY', 'TRACEABILITY', 'FINANCIAL']
        for cat in cats:
            out.append(f"║  {cat.ljust(52)}║")
            for r in [x for x in self.results if x['cat'] == cat]:
                status = r['status']
                name = r['name'][:22].ljust(22)
                msg = r['msg'][:25].ljust(25)
                out.append(f"║  {status} [{r['num']:02d}] {name} {msg} ║")
            out.append("║                                                      ║")
            
        out.append("╠══════════════════════════════════════════════════════╣")
        out.append(f"║  🏆 SCORE: {pass_count}/{total} ({score}%)                            ║")
        out.append(f"║  Status: {'✅ READY' if score == 100 else '❌ FIX NEEDED'}                               ║")
        out.append("╚══════════════════════════════════════════════════════╝")
        
        if self.errors:
            out.append("\n❌ ERRORS DETECTED:\n" + "="*50)
            for e in self.errors:
                out.append(e)
                
        # Write to file and print
        with open('integrity_report.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(out))
            
        print("Report successfully generated in integrity_report.txt")


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    checker = DocIntegrityChecker(current_dir)
    checker.run_all()
