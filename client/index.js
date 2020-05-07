const term = require('terminal-kit').terminal
const Table = require("terminal-table");

const {
  register,
  login,
  getRestaurants,
  getRestaurant,
  addProduct,
  addOrder,
  getRestaurantOrders
} = require('./services')


/* --------------------------- 🌐 Global Variables -------------------------- */
let token = ''
let cart = []
let globalUsername = ''
let globalRole = ''
let globalId = ''


const displayHeader = () => {
  term.clear()
  if (globalUsername !== '') {
    term.green(`Logged in as ${globalUsername} (${globalRole})\n\n`)
  } else {
    term.green(`Not loggend in\n\n`)
  }
}

/* --------------------------------- Signup --------------------------------- */
const signupForm = () => {
  let username
  let password
  let role

  let roles = [
    'Client ',
    'Restaurant '
  ]

  term.white('Enter your email: ')
  term.inputField((_, input) => {
    username = input

    term.white('\nEnter password: ')
    term.inputField({ echoChar: true }, (_, input) => {
      term.white('\nRole: \n')
      password = input

      term.singleColumnMenu(roles, (_, response) => {
        switch (response.selectedIndex) {
          case 0:
            role = 'client'
            break
          case 1:
            role = 'restaurant'
            break
          case 2:
            role = 'admin'
            break
        }
        signupHandler(username, password, role)
      })
    })
  })
}

const signupHandler = async (username, password, role) => {
  try {
    const response = await register(username, password, role)

    term.green(`${response}.\n`)
  }
  catch (e) {
    term.red(`${response}.\n`)
  }
  finally {
    main()
  }
}

/* ---------------------------------- Login --------------------------------- */
const loginForm = () => {
  let username
  let password

  displayHeader()
  term.white('Enter your email: ')
  term.inputField((_, input) => {
    username = input

    term.white('\nEnter password: ')
    term.inputField({ echoChar: true }, (_, input) => {
      password = input

      loginHandler(username, password)
    })
  })
}

const loginHandler = async (username, password) => {
  const response = await login(username, password)
  if (response) {
    token = response.token
    globalUsername = username
    globalRole = response.role
    globalId = response._id
    if (response.role == 'restaurant') {
      displayRestaurantMainMenu(response._id)
    } else {
      appMenu()
    }
  } else {
    term.red(`${response}.\n`)
    main()
  }
}

const displayRestaurantMenu = (menu, restaurantId) => {
  formattedMenu = menu.map(element => `${element.name}\t${element.price}\t${element.description}`)
  formattedMenu.push('Place Order')
  formattedMenu.push('Back')

  var table = new Table()
  table.push(['Name', 'Price', 'Description'])

  displayHeader()
  term.green(`${restaurantId}\n`)
  cart.forEach(element => {
    table.push([element.name, element.price, element.description])
  })

  term.green(`${table}\n`)
  const totalCost = cart.reduce((acc, current) => acc + parseFloat(current.price), 0)
  term.green(`Total cost: ${totalCost}\n`)

  term.singleColumnMenu(formattedMenu, (_, response) => {
    switch (response.selectedIndex) {
      case formattedMenu.length - 1:
        cart = []
        appMenu()
        break
      case formattedMenu.length - 2:
        addOrder(globalId, restaurantId, cart)
        cart = []
        appMenu()
        break
      default:
        cart.push(menu[response.selectedIndex])
        displayRestaurantMenu(menu, restaurantId)
    }
  })
}

const displayProductAdd = (id) => {
  let name
  let price
  let description

  term.green(`${id}\n`)
  term.white('\nName: ')
  term.inputField((_, input) => {
    name = input

    term.white('\nPrice: ')
    term.inputField((_, input) => {
      price = input
      term.white('\nDescription: ')
      term.inputField((_, input) => {
        description = input

        addProduct(name, price, description, id)
        displayRestaurantMainMenu(id)
      })
    })
  })
}

const watchOrders = async (id) => {
  const restaurant = await getRestaurantOrders(id)

  displayHeader()
  term.green(`Orders:\n`)
  restaurant.forEach(element => {
    term.green(`Date:\t${element.createdAt}\n`)
    var table = new Table()
    table.push(['Name', 'Price'])

    element.cart.forEach(item => {
      table.push([item.name, item.price])
    })
    term.green(`${table}\n`)
  })

  term.singleColumnMenu(['Back'], (_, response) => {
    displayRestaurantMainMenu(id)
  })
}

const displayRestaurantMainMenu = async (id) => {
  const restaurant = await getRestaurant(id)

  displayHeader()
  restaurant.menu.forEach(element => {
    term.green(`${element.name}\t${element.price}\t${element.description}\n`)
  })

  const choicesList = [
    'Add product',
    'Watch orders',
    'Exit'
  ]

  term.singleColumnMenu(choicesList, (_, response) => {
    switch (response.selectedIndex) {
      case 0:
        displayProductAdd(id)
        break
      case 1:
        watchOrders(id)
        break
      case 2:
        process.exit()
    }
  })
}

const appMenu = async () => {
  const restaurants = await getRestaurants()

  const appMenu = restaurants.map(rest => rest.name)
  appMenu.push('Exit')

  displayHeader()
  term.gridMenu(appMenu, (_, response) => {
    if (response.selectedIndex === appMenu.length - 1) {
      process.exit()
    }

    displayRestaurantMenu(
      restaurants[response.selectedIndex].menu,
      restaurants[response.selectedIndex]._id
    )
  })
}

const main = async () => {
  const introMenu = [
    'Login ',
    'Signup ',
    'Exit '
  ]

  displayHeader()
  term.blue('Welcome to Pluto food delivery app.\n')
  term.blue('Now available right from terminal.\n')

  term.singleColumnMenu(introMenu, (_, response) => {
    switch (response.selectedIndex) {
      case 0:
        loginForm()
        break
      case 1:
        signupForm()
        break
      case 2:
        process.exit()
    }
  })
}

main()


