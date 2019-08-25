const TYPE_ARRAY = '[object Array]'
const TYPE_OBJECT = '[object Object]'

export default {
  Page: createPage,
  Component: createComponent
}

export function createPage(option) {
  const store = option.store
  if (!store.data || !Object.keys(store.data).length) {
    return Page(option)
  }
  store.instances = store.instances || []
  store.update = store.update || function() { return updateState(store) }
  store.originData = store.originData || JSON.parse(JSON.stringify(store.data))

  const onLoad = option.onLoad
  option.onLoad = function(query) {
    store.instances.unshift(this)
    this.update = store.update
    this.setData(store.data)
    onLoad && onLoad.call(this, query)
  }

  const onUnload = option.onUnload
  option.onUnload = function() {
    store.instances = store.instances.filter(vm => vm !== this)
    onUnload && onUnload.call(this)
  }

  Page(option)
}

export function createComponent(option) {
  const didMount = option.didMount
  option.didMount = function() {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page.store && page.store.data && Object.keys(page.store.data).length) {
      this.store = page.store
      this.store.instances.unshift(this)
      this.update = this.store.update
      this.setData(this.store.data)
    }
    didMount && didMount.call(this)
  }

  const didUnmount = option.didUnmount
  option.didUnmount = function() {
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
      vm.setData(vm._newData, resolve)
      vm._newData = null
    } else {
      resolve()
    }
  })
}

function updateState(store) {
  return new Promise((resolve, rejects) => {
    const promiseArr = []
    const state = JSON.parse(JSON.stringify(store.data))
    const diffState = getDiffState(state, store.originData)
    store.instances.forEach(vm => {
      promiseArr.push(setState(vm, diffState))
    })
    store.originData = JSON.parse(JSON.stringify(store.data))
    Promise.all(promiseArr).then(() => resolve(diffState), rejects)
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