import { PLACEMENT, UPDATE, DELETIONS } from "./CONST";
//当前正在工作的分片任务fiber 用于funtion组件
let wipFiber = null;
//下一个分片任务（浏览器空闲将执行）//这实际保存的是一个指针，确保下次空闲时间能够获取到上次空闲时间处理到了那里
let nextUnitOfWork = null;
// 工作中的 fiberRoot 最终生成的fiber
let wipRoot = null;
// 现在的根节点
let currentRoot = null;
// hook 游标
let hookIndex = null;
// 存放删除fiber的数组, 最后提交的时候进行统一提交，实际存储的是需要被删除的指针。
let deletions = null;

function render(vnode, container) {
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
  //指针1: 移动用来构建 child ---> sibling ---> sibling 
  let prevSibling = null;
  //指针2:  当前比对的fiber的上一个状态，我们在下方随着循环逐步的进行移动。
  //       因为 children 是jsx --->ReactElement 的产物不是一个链表的数据结构，
  //       所以下方我们需要使用 for 循环遍历虚拟dom-tree 生成新的fiber-linkedList 在此期间我们需要参照之前 fiber 中的对应位置的节点所以需要这个指针2
  let oldFiber = workInProgressFiber.base && workInProgressFiber.base.child;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    let newFiber = null;
    // 判断当前fiber 是否为相同类型
    const sameType = child && oldFiber && child.type === oldFiber.type;
    // 1. 相同类型 只进行更新操作
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: child.props, // 用新的属性
        node: oldFiber.node, // 真实dom节点
        base: oldFiber, //存储fiber，作为下一轮比对的依据
        parent: workInProgressFiber, //源码中使用的renturn 这个字段保存当前fiber的父fiber
        effectTag: UPDATE,
      };
    }

    // 2. 不相同类型 之前没有/之前不是这个类型  进行替换操作
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
    //3.之前有现在没有 === 删除
    if (!sameType && oldFiber) {
      oldFiber.effectTag = DELETIONS;
      //将删除的节点放在删除任务队列中
      deletions.push(oldFiber);
    }

    // 指针2 移动，便于下一个节点找到其之前的状态。
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // 理解链表的数据结构：
    // 1. 第一个子元素 i==0 是当前 workInProgressFiber（也就是parent的 child） 
    // 2. 其他的孩子顺次排列都是 “大哥”的sibling
    if (i === 0) {
      workInProgressFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    // 更新指针，更新下一轮循环的挂载节点
    prevSibling = newFiber;
  }
}

// function组件，构建fiber
function updateFunctionComponent(fiber) {
  wipFiber = fiber; //当前正在工作的 fiber
  //在真实的fiber对象中hook是个对象数据结构并且 里面的 memoizedState 字段才是用来存储当前useState应该返回的结果的，而且是个链表，这里山寨简化。
  //这也是为什么React要求hook的调用顺序不能改变（不能在条件语句中使用hook） —— 每次render时都是从一条固定顺序的链表中获取hook对应数据的
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

// 原生标签
function updateHostComponent(fiber) {
  if (!fiber.node) {
    //  在真实的fiber对象中 我们使用stateNode这个字段保存对组件的类实例，DOM节点或与fiber节点关联的其他React元素类型的引用。一般来说，可以认为这个属性用于保存与fiber相关的本地状态。
    //  另外 functionComponent classComponet Fragment 对应的fiberNode 中的node节点都是null 只有原生标签才的node字段才有值！
    fiber.node = createNode(fiber);
  }
  const { children } = fiber.props;
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
  // 深度优先的规则遍历链表 返回下一个分片任务。
  //    下面的 .child / .sibling .parent 都是通过调和过程编织好的结构，但是还没有编制完成，我们需要对更下层的节点继续进行调和过程！最终编织成一个完整的fiber-linkedlist
  //    也就是上面的代码只是对传入进来的 fiber（实际是个react-vnode）的 children 进行了一层的处理，
  //    形成了 currentFiber.child---》siblingOne --》 siblingOne 的结构但是child/siblingOne/siblingOne的更下层我们还没有处理，所以需要下面深度优先的规则更新nextUnitOfWork的指针。
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
    // 有下个子任务，并且当前帧还没有结束
    // nextUnitOfWork
    console.log("=====  nextUnitOfWork  =====", nextUnitOfWork);
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
  //之所以这里需要单独清空 被删除节点的数组 是因为我们在进行调和过程中 如果断言当前effectTag = DELETIONS;时并没有创建新的fibernode 加入到fiber - tree中
  deletions.forEach(commitWorker);
  //
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

//删除节点
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
  // 新旧状态 第二次进来不能使用init了 base 中存储的是上一次 fiber 的具体状态
  // 在真正的 fiber数据结构中 hook 被存储在了 memorizedState 中 而且并不是一个数组结构 而是一个链表结构
  const oldHook = wipFiber.base && wipFiber.base.hooks[hookIndex];
  // 当前的hook 每次调用都是会初始化
  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [], //setstate执行的次数，可以说成保存传递过来的数据，也是高密度触发 setState 最终只是执行最后一次的关键 
  };
  //拿到所有的setstate 统一执行并且获取到最终的state
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((newstate) => {
    // 将当前hook的state进行更新，实际最终获取的是最后一次的值  搜索jsx中的"suprise mother F!!!"
    hook.state = newstate;
  });
  //拿到 setState 这里的action 只是传递过来的数值
  //这里有问题  setState 重复执行了多次 我怀疑在数据绑定的时候
  /**
   * @param {*} action 传递过来的值
   * // 调用 setState 发生了什么
   *  1. =》 将多次setstate的操作的值放入到当前fiber中的 hook.queue
   *  2. ==》 更新定义下一次的单元任务 nextUnitOfWork 触发 requestIdleCallback(workLoop); 此时触发了调和过程
   *  3. ===》 在下一轮构建fiber的过程中 useState重新被执行  -->   上面actions.forEach(()=>{获取到当轮 调和过程最终的state}) （短时间内触发的state 只执行了最后一次 ）
   */
  const setState = (action) => {
    hook.queue.push(action);
    //注意这里使用的 currentRoot 所以我们是从顶层重新diff整个fiber树
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
