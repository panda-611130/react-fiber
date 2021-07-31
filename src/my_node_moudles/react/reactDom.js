import { PLACEMENT, UPDATE, DELETIONS } from "./CONST";
//当前正在工作的分片任务fiber 用于funtion组件
let wipFiber = null;
//下一个分片任务（浏览器空闲将执行）//这实际保存的是一个指针，确保下次空闲时间能够获取到上次空闲时间处理到了那里
let nextUnitOfWork = null;
// 工作中的fiberRoot 最终生成的fiber
let wipRoot = null;
// 现在的根节点
let currentRoot = null;
// hook 游标
let hookIndex = null;
// 存放删除fiber的数组, 最后提交的时候进行统一提交，
let deletions = null;

function render(vnode, container) {
  console.log("== render === render ==");
  wipRoot = {
    node: container,
    props: { children: [vnode] },
    base: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

/**
 *
 * @param {*} workInProgressFiber 当前工作中的fiber,也就是 children 参数的 parent
 * @param {*} children fiber下的children
 */
function reconcilerChildren(workInProgressFiber, children) {
  //当前 子fiber  的前一个 fiber 对于第一个child而言他是null 而第二个子fiber 他就是刚才child
  let prevSibling = null;
  //将当前fiber 上一个状态的数据存储
  let oldFiber = workInProgressFiber.base && workInProgressFiber.base.child;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    let newFiber = null;

    const sameType = child && oldFiber && child.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: child.props, // 用新的属性
        node: oldFiber.node, // 真实dom节点
        base: oldFiber, //存储fiber，便于去比较
        parent: workInProgressFiber,
        effectTag: UPDATE,
      };
    }

    // 之前没有现在有了 === 新增
    if (!sameType && child) {
      newFiber = {
        type: child.type,
        props: child.props,
        node: null,
        base: null,
        parent: workInProgressFiber,
        effectTag: PLACEMENT,
      };
    }
    //之前有现在没有 === 删除
    if (!sameType && oldFiber) {
      oldFiber.effectTag = DELETIONS;
      //将删除的节点放在删除任务队列中
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 理解链表的数据结构：
    // 1. 第一个子元素是当前 workInProgressFiber（也就是parent的 child）
    // 2. 其他的孩子顺次排列都是 “大哥”的sibling
    if (i === 0) {
      workInProgressFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    // 下一次循环的 大哥 就是现在 完成的 newFiber
    prevSibling = newFiber;
  }
}

// function组件，构建fiber
function updateFunctionComponent(fiber) {
  wipFiber = fiber; //当前正在工作的 fiber
  wipFiber.hooks = []; //为当前工作的fiber添加 hook 数组
  hookIndex = 0;
  const { type, props } = fiber;
  const children = [type(props)]; //执行这个函数的时候hook也被挂载到了当前这个fiber的base额上
  reconcilerChildren(fiber, children);
}
// 更新class组件，构建fiber
function updateClassComponent(fiber) {
  const { type, props } = fiber;
  const cmp = new type(props);
  const children = [cmp.render()];
  reconcilerChildren(fiber, children);
}

/**
 * 更新当前dom上的一些属性
 * @param {*} node  dom节点
 * @param {*} prevVal  上一个状态时本dom上的一些属性
 * @param {*} nextVal   下一个状态时 dom上的属性
 */
function updateNode(node, prevVal, nextVal) {
  //上一次的属性值遍历 删除一些之前定义的属性
  Object.keys(prevVal)
    .filter((k) => k !== "children")
    .filter((k) => !(k in nextVal)) //下一次新的节点属性值中没有这个了我们就要把这个删除
    .forEach((k) => {
      if (k.slice(0, 2) === "on") {
        // 以on开头，就认为是一个事件，源码处理复杂一些，这直接移除事件就可以
        let eventName = k.slice(2).toLocaleLowerCase();
        node.removeEventListener(eventName, prevVal[k]);
      } else {
        if (!(k in nextVal)) {
          //下一次更新没有这个属性了
          node[k] = "";
        }
      }
    });

  //添加 新的属性这些属性
  Object.keys(nextVal)
    .filter((k) => k !== "children")
    .forEach((k) => {
      if (k.slice(0, 2) === "on") {
        // 以on开头，就认为是一个事件，源码处理复杂一些，
        let eventName = k.slice(2).toLocaleLowerCase();
        node.removeEventListener(eventName, prevVal[k]); //这里删除一次只为了避免重复添加
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    });
}

/**
 * 根据虚拟dom生成对应的 真实dom
 * @param {*} vnode 虚拟dom
 */
function createNode(vnode) {
  const { type, props } = vnode;
  let node;
  if (type === "TEXT") {
    node = document.createTextNode("");
  } else if (type) {
    node = document.createElement(type);
  }
  updateNode(node, {}, props);
  return node;
}

// 原生标签
function updateHostComponent(fiber) {
  if (!fiber.node) {
    fiber.node = createNode(fiber);
  }
  const { children } = fiber.props;
  reconcilerChildren(fiber, children);
}

// Fragment标签，构建fiber
function updateFragmentComponent(fiber) {
  const { children } = fiber.props;
  reconcilerChildren(fiber, children);
}

function performUnitOfWork(fiber) {
  const { type } = fiber;
  if (typeof type === "function") {
    type.isReactComponent
      ? updateClassComponent(fiber)
      : updateFunctionComponent(fiber);
  } else if (type) {
    updateHostComponent(fiber);
  } else {
    // 为Fragment
    updateFragmentComponent(fiber);
  }

  //深度优先的规则遍历链表 返回下一个分片任务
  //下面的 .child / .sibling .parent 都是在上面代码中已经设置好的fiber
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

/**
 *  浏览器空闲时候执行的函数
 * @param {*} deadline
 */
function workLoop(deadline) {
  // 空闲了执行子任务
  // 返回下一个子任务
  // ...等到下一次空闲继续执行上面的流程
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    //有下个子任务，并且当前帧还没有结束
    // nextUnitOfWork
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // 没有子任务了，进行提交更新
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // 完成第一轮任务后 继续监听
  requestIdleCallback(workLoop);
}

// 借鉴 requestIdleCallback 的思想实现了任务分片
requestIdleCallback(workLoop);

function commitRoot() {
  deletions.forEach(commitWorker);
  commitWorker(wipRoot.child);
  console.log("== 将最终生成的 fiber 进行处理 ==", wipRoot);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWorker(fiber) {
  if (!fiber) {
    return;
  }

  let parentNodeFiber = fiber.parent;
  while (!parentNodeFiber.node) {
    parentNodeFiber = parentNodeFiber.parent;
  }
  //进过上面的查找找到了当前fiber可以挂载的真实dom 节点
  const parentNode = parentNodeFiber.node;
  // 更新 删除 新增
  if (fiber.effectTag === PLACEMENT && fiber.node !== null) {
    parentNode.appendChild(fiber.node);
  } else if (fiber.effectTag === UPDATE && fiber.node !== null) {
    //这个情况
    updateNode(fiber.node, fiber.base.props, fiber.props);
  } else if (fiber.effectTag === DELETIONS && fiber.node !== null) {
    commitDeletions(fiber, parentNode);
  }
  //深度优先进行挂载
  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}

//删除
function commitDeletions(fiber, parentNode) {
  if (fiber.node) {
    //如果有父节点 node
    parentNode.removeChild(fiber.node);
  } else {
    //对于类组件还有函数组组建 其render/renturn返回的jsx中是没有 node节点 实际相当于把内部的东西直接挂载到了上一层的父元素上
    commitDeletions(fiber.child, parentNode);
  }
}

export function useState(init) {
  // 新旧状态  第二次进来不能使用init了 base 中存储的是上一次 fiber 的具体状态
  const oldHook = wipFiber.base && wipFiber.base.hooks[hookIndex];
  console.log("== hookIndex ===", hookIndex);
  // 当前的hook 每次调用都是会初始化
  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [], //setstate执行的次数，可以说成保存传递过来的数据，也是 高密度触发 setState 最终只是执行最后一次的关键 
  };

  //拿到state
  const actions = oldHook ? oldHook.queue : [];

  actions.forEach((action) => {
    // 将当前hook的state进行更新，实际最终获取的是最后一次的值  搜索jsx中的"suprise mother F!!!"
    hook.state = action;
  });
  //拿到 setState 这里的action 只是传递过来的数值
  //这里有问题  setState 重复执行了多次 我怀疑在数据绑定的时候
  /**
   * @param {*} action 传递过来的值
   * 
   * // 调用 setState 发生了什么
   *  1. =》 当前fiber中的 hook.queue 进行更新下一轮渲染需要的初始值
   *  2. ==》更新定义下一次的单元任务 nextUnitOfWork 触发 requestIdleCallback(workLoop); 此时触发了调和过程
   *  3. ===》 在下一轮构建fiber的过程中 useState重新被执行  -->   上面actions.forEach(()=>{获取到当轮 调和过程最终的state}) （短时间内触发的state 只执行了最后一次 ）
   */
  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      node: currentRoot.node,
      props: currentRoot.props,
      base: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  //向当前fiber中添加hook 选项
  wipFiber.hooks.push(hook);
  hookIndex++; //这个index 并不是为了点击事件的时候到 hooks 中寻找
  return [hook.state, setState];
}

export default {
  render,
};
