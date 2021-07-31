function render(vnode, container) {
  // console.log("vnode", vnode); //sy-log
  // vnode->node
  const node = createNode(vnode);
  //把node更新到container
  container.appendChild(node);
}

// 根据vnode，创建一个node  核心 生成一个node
function createNode(vnode) {
  const { type, props } = vnode;
  let node;
  // type: 实际就是虚拟节点 class｜fuction｜Fragment｜Text这几种类型的处理
  //注意类组件和函数组件本质上都是函数，class只不过是一个语法糖
  if (typeof type === "function") {
    //对于function组件的处理
    node = type.isReactComponent
      ? // node = type.prototype.isReactComponent
        updateClassComponent(vnode)
      : updateFunctionComponent(vnode);
  } else if (type === "TEXT") {
    node = document.createTextNode("");
  } else if (type) {
    //html
    node = document.createElement(type);
  } else {
    //fragment
    node = document.createDocumentFragment();
  }
  //给节点添加各种属性
  updateNode(node, props);
  //给当前节点children进行处理  实际这里是对子节点递归的关键
  reconcilerChildren(props.children, node);
  return node;
}

/**
 *
 * @param {*} children 虚拟dom
 * @param {*} node  node 是当前节点的父节点
 */
function reconcilerChildren(children, node) {
  // node 是这些 chilidren的父节点 将这些孩子以此append 到这个node上面
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    // 遍历 创建元素--这里是对数组情况的处理 比如map函数的处理
    // 判读children[i]类型 针对虚拟dom是数组的情况。
    if (Array.isArray(child)) {
      for (let j = 0; j < child.length; j++) {
        render(child[j], node);
      }
    } else {
      //当个孩子的时候是个objec
      render(children[i], node);
    }
  }
}

// 更新节点上属性，如className、nodeValue等
function updateNode(node, nextVal) {
  Object.keys(nextVal)
    .filter((k) => k !== "children") //children 这个属性并不需要添加的真正的dom 节点上所以直接去除掉就可以了
    .forEach((k) => {
      // 以on开头，就认为是一个事件，那就给弄node绑定这个事件源码处理复杂一些，
      if (k.slice(0, 2) === "on") {
        let eventName = k.slice(2).toLocaleLowerCase();
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    });
}

// function组件，返回真实node
function updateFunctionComponent(vnode) {
  // type 就是函数名 将它执行了就可以获取到对应的Vnode
  const { type, props } = vnode;
  const vvnode = type(props);
  const node = createNode(vvnode);
  return node;
}

// class 组件 返回真实dom
function updateClassComponent(vnode) {
  const { type, props } = vnode;
  //type 是class 我们实例话一下再调用下render方法就可以获取到组件实例vnode
  const cmp = new type(props); //实例化
  //调用render后获取的也是 虚拟dom
  const vvnode = cmp.render();
  const node = createNode(vvnode);
  return node;
}
export default {
  render,
};
