// Test file with multiple errors for the Error Fixer

function MyComponent() {
  x = 5
  const [count, setCount] = useState(0)
  var name = 'test'
  console.log('Debug:', count)
  
  y = 10
  const message = 'Hello World'
  
  try {
    doSomething()
  } catch (error) {}
  
  return count + x + y
}
