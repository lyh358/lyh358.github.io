// LeetCode 热题 100（top-100-liked）数据
// 分类顺序与 https://leetcode.cn/studyplan/top-100-liked/ 保持一致
// difficulty: 1=简单 2=中等 3=困难

const CATEGORIES = [
  "哈希", "双指针", "滑动窗口", "子串", "普通数组", "矩阵", "链表",
  "二叉树", "图论", "回溯", "二分查找", "栈", "堆", "贪心算法",
  "动态规划", "多维动态规划", "技巧"
];

const PROBLEMS = [
  // 哈希
  { id: 1,   title: "两数之和",                              slug: "two-sum",                                                    diff: 1, cat: "哈希" },
  { id: 49,  title: "字母异位词分组",                        slug: "group-anagrams",                                             diff: 2, cat: "哈希" },
  { id: 128, title: "最长连续序列",                          slug: "longest-consecutive-sequence",                               diff: 2, cat: "哈希" },
  // 双指针
  { id: 283, title: "移动零",                                slug: "move-zeroes",                                                diff: 1, cat: "双指针" },
  { id: 11,  title: "盛最多水的容器",                        slug: "container-with-most-water",                                  diff: 2, cat: "双指针" },
  { id: 15,  title: "三数之和",                              slug: "3sum",                                                       diff: 2, cat: "双指针" },
  { id: 42,  title: "接雨水",                                slug: "trapping-rain-water",                                        diff: 3, cat: "双指针" },
  // 滑动窗口
  { id: 3,   title: "无重复字符的最长子串",                  slug: "longest-substring-without-repeating-characters",             diff: 2, cat: "滑动窗口" },
  { id: 438, title: "找到字符串中所有字母异位词",            slug: "find-all-anagrams-in-a-string",                              diff: 2, cat: "滑动窗口" },
  // 子串
  { id: 560, title: "和为 K 的子数组",                       slug: "subarray-sum-equals-k",                                      diff: 2, cat: "子串" },
  { id: 239, title: "滑动窗口最大值",                        slug: "sliding-window-maximum",                                     diff: 3, cat: "子串" },
  { id: 76,  title: "最小覆盖子串",                          slug: "minimum-window-substring",                                   diff: 3, cat: "子串" },
  // 普通数组
  { id: 53,  title: "最大子数组和",                          slug: "maximum-subarray",                                           diff: 2, cat: "普通数组" },
  { id: 56,  title: "合并区间",                              slug: "merge-intervals",                                            diff: 2, cat: "普通数组" },
  { id: 189, title: "轮转数组",                              slug: "rotate-array",                                               diff: 2, cat: "普通数组" },
  { id: 238, title: "除自身以外数组的乘积",                  slug: "product-of-array-except-self",                               diff: 2, cat: "普通数组" },
  { id: 41,  title: "缺失的第一个正数",                      slug: "first-missing-positive",                                     diff: 3, cat: "普通数组" },
  // 矩阵
  { id: 73,  title: "矩阵置零",                              slug: "set-matrix-zeroes",                                          diff: 2, cat: "矩阵" },
  { id: 54,  title: "螺旋矩阵",                              slug: "spiral-matrix",                                              diff: 2, cat: "矩阵" },
  { id: 48,  title: "旋转图像",                              slug: "rotate-image",                                               diff: 2, cat: "矩阵" },
  { id: 240, title: "搜索二维矩阵 II",                       slug: "search-a-2d-matrix-ii",                                      diff: 2, cat: "矩阵" },
  // 链表
  { id: 160, title: "相交链表",                              slug: "intersection-of-two-linked-lists",                           diff: 1, cat: "链表" },
  { id: 206, title: "反转链表",                              slug: "reverse-linked-list",                                        diff: 1, cat: "链表" },
  { id: 234, title: "回文链表",                              slug: "palindrome-linked-list",                                     diff: 1, cat: "链表" },
  { id: 141, title: "环形链表",                              slug: "linked-list-cycle",                                          diff: 1, cat: "链表" },
  { id: 142, title: "环形链表 II",                           slug: "linked-list-cycle-ii",                                       diff: 2, cat: "链表" },
  { id: 21,  title: "合并两个有序链表",                      slug: "merge-two-sorted-lists",                                     diff: 1, cat: "链表" },
  { id: 2,   title: "两数相加",                              slug: "add-two-numbers",                                            diff: 2, cat: "链表" },
  { id: 19,  title: "删除链表的倒数第 N 个结点",             slug: "remove-nth-node-from-end-of-list",                           diff: 2, cat: "链表" },
  { id: 24,  title: "两两交换链表中的节点",                  slug: "swap-nodes-in-pairs",                                        diff: 2, cat: "链表" },
  { id: 25,  title: "K 个一组翻转链表",                      slug: "reverse-nodes-in-k-group",                                   diff: 3, cat: "链表" },
  { id: 138, title: "随机链表的复制",                        slug: "copy-list-with-random-pointer",                              diff: 2, cat: "链表" },
  { id: 148, title: "排序链表",                              slug: "sort-list",                                                  diff: 2, cat: "链表" },
  { id: 23,  title: "合并 K 个升序链表",                     slug: "merge-k-sorted-lists",                                       diff: 3, cat: "链表" },
  { id: 146, title: "LRU 缓存",                              slug: "lru-cache",                                                  diff: 2, cat: "链表" },
  // 二叉树
  { id: 94,  title: "二叉树的中序遍历",                      slug: "binary-tree-inorder-traversal",                              diff: 1, cat: "二叉树" },
  { id: 104, title: "二叉树的最大深度",                      slug: "maximum-depth-of-binary-tree",                               diff: 1, cat: "二叉树" },
  { id: 226, title: "翻转二叉树",                            slug: "invert-binary-tree",                                         diff: 1, cat: "二叉树" },
  { id: 101, title: "对称二叉树",                            slug: "symmetric-tree",                                             diff: 1, cat: "二叉树" },
  { id: 543, title: "二叉树的直径",                          slug: "diameter-of-binary-tree",                                    diff: 1, cat: "二叉树" },
  { id: 102, title: "二叉树的层序遍历",                      slug: "binary-tree-level-order-traversal",                          diff: 2, cat: "二叉树" },
  { id: 108, title: "将有序数组转换为二叉搜索树",            slug: "convert-sorted-array-to-binary-search-tree",                 diff: 1, cat: "二叉树" },
  { id: 98,  title: "验证二叉搜索树",                        slug: "validate-binary-search-tree",                                diff: 2, cat: "二叉树" },
  { id: 230, title: "二叉搜索树中第 K 小的元素",             slug: "kth-smallest-element-in-a-bst",                              diff: 2, cat: "二叉树" },
  { id: 199, title: "二叉树的右视图",                        slug: "binary-tree-right-side-view",                                diff: 2, cat: "二叉树" },
  { id: 114, title: "二叉树展开为链表",                      slug: "flatten-binary-tree-to-linked-list",                         diff: 2, cat: "二叉树" },
  { id: 105, title: "从前序与中序遍历序列构造二叉树",        slug: "construct-binary-tree-from-preorder-and-inorder-traversal",  diff: 2, cat: "二叉树" },
  { id: 437, title: "路径总和 III",                          slug: "path-sum-iii",                                               diff: 2, cat: "二叉树" },
  { id: 236, title: "二叉树的最近公共祖先",                  slug: "lowest-common-ancestor-of-a-binary-tree",                    diff: 2, cat: "二叉树" },
  { id: 124, title: "二叉树中的最大路径和",                  slug: "binary-tree-maximum-path-sum",                               diff: 3, cat: "二叉树" },
  // 图论
  { id: 200, title: "岛屿数量",                              slug: "number-of-islands",                                          diff: 2, cat: "图论" },
  { id: 994, title: "腐烂的橘子",                            slug: "rotting-oranges",                                            diff: 2, cat: "图论" },
  { id: 207, title: "课程表",                                slug: "course-schedule",                                            diff: 2, cat: "图论" },
  { id: 208, title: "实现 Trie (前缀树)",                    slug: "implement-trie-prefix-tree",                                 diff: 2, cat: "图论" },
  // 回溯
  { id: 46,  title: "全排列",                                slug: "permutations",                                               diff: 2, cat: "回溯" },
  { id: 78,  title: "子集",                                  slug: "subsets",                                                    diff: 2, cat: "回溯" },
  { id: 17,  title: "电话号码的字母组合",                    slug: "letter-combinations-of-a-phone-number",                      diff: 2, cat: "回溯" },
  { id: 39,  title: "组合总和",                              slug: "combination-sum",                                            diff: 2, cat: "回溯" },
  { id: 22,  title: "括号生成",                              slug: "generate-parentheses",                                       diff: 2, cat: "回溯" },
  { id: 79,  title: "单词搜索",                              slug: "word-search",                                                diff: 2, cat: "回溯" },
  { id: 131, title: "分割回文串",                            slug: "palindrome-partitioning",                                    diff: 2, cat: "回溯" },
  { id: 51,  title: "N 皇后",                                slug: "n-queens",                                                   diff: 3, cat: "回溯" },
  // 二分查找
  { id: 35,  title: "搜索插入位置",                          slug: "search-insert-position",                                     diff: 1, cat: "二分查找" },
  { id: 74,  title: "搜索二维矩阵",                          slug: "search-a-2d-matrix",                                         diff: 2, cat: "二分查找" },
  { id: 34,  title: "在排序数组中查找元素的第一个和最后一个位置", slug: "find-first-and-last-position-of-element-in-sorted-array", diff: 2, cat: "二分查找" },
  { id: 33,  title: "搜索旋转排序数组",                      slug: "search-in-rotated-sorted-array",                             diff: 2, cat: "二分查找" },
  { id: 153, title: "寻找旋转排序数组中的最小值",            slug: "find-minimum-in-rotated-sorted-array",                       diff: 2, cat: "二分查找" },
  { id: 4,   title: "寻找两个正序数组的中位数",              slug: "median-of-two-sorted-arrays",                                diff: 3, cat: "二分查找" },
  // 栈
  { id: 20,  title: "有效的括号",                            slug: "valid-parentheses",                                          diff: 1, cat: "栈" },
  { id: 155, title: "最小栈",                                slug: "min-stack",                                                  diff: 2, cat: "栈" },
  { id: 394, title: "字符串解码",                            slug: "decode-string",                                              diff: 2, cat: "栈" },
  { id: 739, title: "每日温度",                              slug: "daily-temperatures",                                         diff: 2, cat: "栈" },
  { id: 84,  title: "柱状图中最大的矩形",                    slug: "largest-rectangle-in-histogram",                             diff: 3, cat: "栈" },
  // 堆
  { id: 215, title: "数组中的第 K 个最大元素",               slug: "kth-largest-element-in-an-array",                            diff: 2, cat: "堆" },
  { id: 347, title: "前 K 个高频元素",                       slug: "top-k-frequent-elements",                                    diff: 2, cat: "堆" },
  { id: 295, title: "数据流的中位数",                        slug: "find-median-from-data-stream",                               diff: 3, cat: "堆" },
  // 贪心算法
  { id: 121, title: "买卖股票的最佳时机",                    slug: "best-time-to-buy-and-sell-stock",                            diff: 1, cat: "贪心算法" },
  { id: 55,  title: "跳跃游戏",                              slug: "jump-game",                                                  diff: 2, cat: "贪心算法" },
  { id: 45,  title: "跳跃游戏 II",                           slug: "jump-game-ii",                                               diff: 2, cat: "贪心算法" },
  { id: 763, title: "划分字母区间",                          slug: "partition-labels",                                           diff: 2, cat: "贪心算法" },
  // 动态规划
  { id: 70,  title: "爬楼梯",                                slug: "climbing-stairs",                                            diff: 1, cat: "动态规划" },
  { id: 118, title: "杨辉三角",                              slug: "pascals-triangle",                                           diff: 1, cat: "动态规划" },
  { id: 198, title: "打家劫舍",                              slug: "house-robber",                                               diff: 2, cat: "动态规划" },
  { id: 279, title: "完全平方数",                            slug: "perfect-squares",                                            diff: 2, cat: "动态规划" },
  { id: 322, title: "零钱兑换",                              slug: "coin-change",                                                diff: 2, cat: "动态规划" },
  { id: 139, title: "单词拆分",                              slug: "word-break",                                                 diff: 2, cat: "动态规划" },
  { id: 300, title: "最长递增子序列",                        slug: "longest-increasing-subsequence",                             diff: 2, cat: "动态规划" },
  { id: 152, title: "乘积最大子数组",                        slug: "maximum-product-subarray",                                   diff: 2, cat: "动态规划" },
  { id: 416, title: "分割等和子集",                          slug: "partition-equal-subset-sum",                                 diff: 2, cat: "动态规划" },
  { id: 32,  title: "最长有效括号",                          slug: "longest-valid-parentheses",                                  diff: 3, cat: "动态规划" },
  // 多维动态规划
  { id: 62,  title: "不同路径",                              slug: "unique-paths",                                               diff: 2, cat: "多维动态规划" },
  { id: 64,  title: "最小路径和",                            slug: "minimum-path-sum",                                           diff: 2, cat: "多维动态规划" },
  { id: 5,   title: "最长回文子串",                          slug: "longest-palindromic-substring",                              diff: 2, cat: "多维动态规划" },
  { id: 1143,title: "最长公共子序列",                        slug: "longest-common-subsequence",                                 diff: 2, cat: "多维动态规划" },
  { id: 72,  title: "编辑距离",                              slug: "edit-distance",                                              diff: 2, cat: "多维动态规划" },
  // 技巧
  { id: 136, title: "只出现一次的数字",                      slug: "single-number",                                              diff: 1, cat: "技巧" },
  { id: 169, title: "多数元素",                              slug: "majority-element",                                           diff: 1, cat: "技巧" },
  { id: 75,  title: "颜色分类",                              slug: "sort-colors",                                                diff: 2, cat: "技巧" },
  { id: 31,  title: "下一个排列",                            slug: "next-permutation",                                           diff: 2, cat: "技巧" },
  { id: 287, title: "寻找重复数",                            slug: "find-the-duplicate-number",                                  diff: 2, cat: "技巧" },
];

const DIFF_TEXT = { 1: "简单", 2: "中等", 3: "困难" };

// 便捷索引
const PROBLEM_BY_ID = PROBLEMS.reduce((m, p) => (m[p.id] = p, m), {});
