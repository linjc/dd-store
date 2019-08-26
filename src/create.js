const TYPE_ARRAY = '[object Array]'
const TYPE_OBJECT = '[object Object]'

export default {
  Page: createPage,
  Component: createComponent
}

export function createPage(option) {
  const store = option.store || {}
  store.data = store.data || {}
  store.instances = store.instances || []
  store.update = store.update || function () { return updateState(store) }

  const onLoad = option.onLoad
  option.onLoad = function (query) {
    store.instances.unshift(this)
    this.update = store.update
    getInitState(store.data, option.data)
    this.setData(option.data)
    onLoad && onLoad.call(this, query)
  }

  const onUnload = option.onUnload
  option.onUnload = function () {
    store.instances = store.instances.filter(vm => vm !== this)
    onUnload && onUnload.call(this)
  }

  Page(option)
}

export function createComponent(option) {
  const didMount = option.didMount
  option.didMount = function () {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    this.store = page.store
    this.store.instances.unshift(this)
    this.update = this.store.update
    getInitState(this.store.data, option.data)
    this.setData(option.data)
    didMount && didMount.call(this)
  }

  const didUnmount = option.didUnmount
  option.didUnmount = function () {
    this.store.instances = this.store.instances.filter(vm => vm !== this)
    didUnmount && didUnmount.call(this)
  }

  Component(option)
}

function setState(vm, data) {
  if (!vm || !vm.setData || typeof data !== 'object') {
    return Promise.resolve();
  }
  vm._newData = Object.assign({}, vm._newData || {}, data)
  return new Promise(resolve => {
    if (vm._newData && Object.keys(vm._newData).length) {
      const diffState = getDiffState(JSON.parse(JSON.stringify(data)), vm.data)
      vm.setData(diffState, resolve)
      vm._newData = null
    } else {
      resolve()
    }
  })
}

function updateState(store) {
  return new Promise((resolve, rejects) => {
    const promiseArr = []
    store.instances.forEach(vm => {
      const obj = {}
      for (let key in vm.data) {
        if (store.data.hasOwnProperty(key)) {
          obj[key] = store.data[key]
        }
      }
      if (Object.keys(obj).length > 0) {
        promiseArr.push(setState(vm, obj))
      }
    })
    Promise.all(promiseArr).then(resolve, rejects)
  })
}

function getInitState(from, to) {
  Object.keys(to).forEach(key => {
    if (from.hasOwnProperty(key)) {
      to[key] = JSON.parse(JSON.stringify(from[key]))
    }
  })
}

function getDiffState(state, preState) {
  const newState = {}
  stateDiff(state, preState, '', newState)
  return newState
}

function getType(obj) {
  return Object.prototype.toString.call(obj)
}

function addDiffState(newState, key, val) {
  key !== '' && (newState[key] = val)
}

function stateDiff(state, preState, path, newState) {
  if (state === preState) return
  const stateType = getType(state)
  const preStateType = getType(preState)
  if (stateType === TYPE_OBJECT) {
    const stateLen = Object.keys(state).length
    const preStateLen = Object.keys(state).length
    if (preStateType !== TYPE_OBJECT || stateLen < preStateLen || stateLen === 0 || preStateLen === 0) {
      addDiffState(newState, path, state)
      return
    }
    if (path !== '') {
      for (let key in preState) {
        if (state[key] === undefined) {
          state[key] = null // 已删除的属性设置为null
        }
      }
    }
    for (let key in state) {
      const subPath = path === '' ? key : path + '.' + key
      stateDiff(state[key], preState[key], subPath, newState)
    }
    return
  }
  if (stateType === TYPE_ARRAY) {
    if (preStateType != TYPE_ARRAY || state.length < preState.length || state.length === 0 || preState.length === 0) {
      addDiffState(newState, path, state)
      return
    }
    if (path !== '') {
      preState.forEach((item, index) => {
        if (state[index] === undefined) {
          state[index] = null // 已删除的属性设置为null
        }
      })
    }
    state.forEach((item, index) => {
      stateDiff(item, preState[index], path + '[' + index + ']', newState)
    })
    return
  }
  addDiffState(newState, path, state)
}