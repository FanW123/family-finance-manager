-- ============================================
-- 修复预算数据：删除错误保存到新用户的预算数据
-- ============================================
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- ============================================
-- 
-- 使用说明：
-- 1. 首先运行查询，查看所有用户的预算数据
-- 2. 确认哪个用户ID是原账户，哪个是新账户
-- 3. 如果新账户有数据但应该是空的，删除新账户的数据
-- ============================================

-- 1. 查看所有用户的预算数据
SELECT 
  user_id,
  jsonb_array_length(categories) as category_count,
  created_at,
  updated_at
FROM budget_categories
ORDER BY created_at DESC;

-- 2. 查看每个用户的预算类别详情（可选，用于确认）
-- SELECT 
--   user_id,
--   categories
-- FROM budget_categories
-- ORDER BY created_at DESC;

-- 3. 删除特定用户的预算数据（替换 <新用户ID> 为实际的新用户ID）
-- DELETE FROM budget_categories 
-- WHERE user_id = '<新用户ID>';
-- 
-- 例如，如果新用户ID是 '707dd342-aa33-42dd-bcdf-be34b27d3eec'：
-- DELETE FROM budget_categories 
-- WHERE user_id = '707dd342-aa33-42dd-bcdf-be34b27d3eec';

-- 4. 验证删除结果
-- SELECT 
--   user_id,
--   jsonb_array_length(categories) as category_count
-- FROM budget_categories
-- ORDER BY created_at DESC;

