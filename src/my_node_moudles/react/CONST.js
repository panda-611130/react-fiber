


export const PLACEMENT = "PLACEMENT";
export const UPDATE = "UPDATE";
export const DELETIONS = "DELETIONS";

// 
// 源码中并非使用字符串，表示当前fiber的状态 而是通过二进制进行表示
// 核心作用：可以进行唯一性的组合，使运算更加高效快速。
// 注： 这里的flags都是二进制，这个和React中用到的位运算有关。首先我们要知道位运算只能用于整数，并且是直接对二进制位进行计算，直接处理每一个比特位，是非常底层的运算，运算速度极快。

// ​        比如说workInProgress.flags为132，那这个时候，workInProgress.effectTag & Update 和 workInProgress.flags & Ref在布尔值上都是true，这个时候就是既要执行`update effect`，还要执行`ref update`。

// ​        还有一个例子如workInProgress.flags |= Placement;这里就是说给workInProgress添加一个Placement的副作用。

// ​        这种处理不仅速度快，而且简洁方便，是非常巧妙的方式，很值得我们学习借鉴。

// export const NoFlags = /*                      */ 0b00000000000000000000;

// export const Placement = /*                    */ 0b0000000000000000000010; // 2
// export const Update = /*                       */ 0b0000000000000000000100; // 4
// export const Deletion = /*                     */ 0b0000000000000000001000; // 8

// *******************************************************************************************