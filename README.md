- 学习react-fiber 任务分片的大致实现原理，
- 了解fiber的数据结构为链表

## 核心理解
1. react fiber 基于 requestIdleCallback的思想（注意只是基于思想，并不是直接使用）
2. 和之前版本react 相比 react 可以实现任务分片将 一些高优先级的任务先执行，当前帧空闲后在进行dom的更新（识时务者为俊杰，不再是无脑递归占中主线程）
3. 我们通过链表的数据结构 保证我们可以保存当前任务的指针（从这里离开），等到高优先级的任务结束后，从指针出发继续工作。这是fiber 进行任务分片一个很重要的数据结构基础。

4. ReactDOM.render 的核心在于生成一个链表的数据结构（也就是fiber，过程类似一个织毛衣的过程！有其他更重要的事情，毛衣放在一边，针没有拔出来！等其他事情忙完后拿起针 继续织fiber 等到完全织完了，进行提交）
- 3.1   wipRoot 是我们最终生成的完整fiber tree
- 3.2   nextUnitOfWork 保存的是一个指针，这样我们能在下次浏览器空闲的时机知道我们下阶段“去哪里”-“哪里织毛衣”
- 3.3    wipFiber 用来保存 function组件 生成的fiber的指针。方便一些hook函数的添加
- 3.3 深度优先的规则进行fiber的构建，以及最终dom的操作（增删改）

4. useState 核心
   当前fiber片段的 hook 存贮在了一个数组中 需要用hookindex进行维护
  const [value,willTriggerDiffFunc] = useState()
  1. 每次调用 triggerDiff(value) 会触发新一轮的diff
  2. value 获取的是当轮diff后放入续后一次 willTriggerDiffFunc 传递的值，搜索 actions.forEach


react 优化
- 

react 18 变动
- https://blog.csdn.net/yehuozhili/article/details/117912552



- react-hook 
  - react-hook的使用规则（为什么只能在顶层进行使用）
  - hook api 的具体状态都是存储到了（记录在）对应函数组件形成的fiber节点上: 
    - fiber.memorizedState(hook0)->next(hook1)->next(hook2)->next(hook3)(workInPressHook 尾节点)
  - 具体的存储结构是个链表！只是通过next指针进行关联，之所以hook只能在最顶层使用是因为我们使用链表进行存储，他们没有名字，我们只能通过顺序区分我们定义过的hook，所以只能在最顶层使用！不能在循环if嵌套中使用hook（因为这样的话 hook 的顺序不具有稳定性）
  - 