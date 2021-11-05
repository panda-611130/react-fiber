// 目前这里只做了 isReactComponent 以及将实例话时候传递过来的props 直接挂载到 this实例上两件事情
export default class Component {
  static isReactComponent = {};//判断是否为一个类组件
  constructor(props) {
    this.props = props;
  }
}
