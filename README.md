- 学习react-fiber 任务分片的大致实现原理，
- 了解fiber的数据结构为链表

## 核心理解
1. react fiber 基于 requestIdleCallback的思想（注意只是基于思想，并不是直接使用）
2. 和之前版本react 相比 react 可以实现任务分片将 一些高优先级的任务先执行，当前帧空闲后在进行dom的更新（识时务者为俊杰，不再是无脑递归占中主线程）
3. ReactDOM.render 的核心在于生成一个 链表的数据结构（也就是fiber）
- 3.1   wipRoot 是我们最终生成的完整fiber tree
- 3.2   nextUnitOfWork 保存的是一个指针，这样我们能在下次浏览器空闲的时机知道我们下阶段“去哪里”-“搬哪块砖”
- 3.3    wipFiber 用来保存 function组件 生成的fiber的指针。方便一些hook函数的添加
- 3.3 深度优先的规则进行fiber的构建，以及最终dom的操作（增删改）

4. useState 核心
   当前fiber片段的 hook 存贮在了一个数组中 需要用hookindex进行维护
  const [value,willTriggerDiffFunc] = useState()
  1. 每次调用 triggerDiff(value) 会触发新一轮的diff
  2. value 获取的是当轮diff后放入续后一次 willTriggerDiffFunc 传递的值，搜索 actions.forEach
  3.
