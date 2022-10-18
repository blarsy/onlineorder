import { OrderData, OrderStatus } from "../../lib/common"
import { ordersIdentical } from "../../lib/orderVolumes"

const makeOrder = (quantities: {
    productId: number;
    quantity: number;
}[], quantitiesNonLocal: {
    productId: number;
    quantity: number;
}[]) => {
    return {
        quantities,
        quantitiesNonLocal,
        status: OrderStatus.draft,
        note: '',
        preferredDeliveryTimes: []  
    }
}

test('Not identical when no previous order', () => {
    expect(ordersIdentical({} as OrderData, null)).toBeFalsy()
})
test('Not identical when different number of quantities', () => {
    const order = makeOrder([{ quantity:1, productId: 1 }],[])
    const previousOrder = makeOrder([{ quantity:1, productId: 1 },
        { quantity: 2, productId: 2 }],[])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Not identical when different number of quantities (non-local products)', () => {
    const order = makeOrder([],[{ quantity:1, productId: 1 }])
    const previousOrder = makeOrder([], [{ quantity:1, productId: 1 },
        { quantity: 2, productId: 2 }])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Not identical when a product in the new order cannot be found in the previous version', () => {
    const order = makeOrder([{ quantity:1, productId: 1 }], [])
    const previousOrder = makeOrder([], [{ quantity: 2, productId: 2 }])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Not identical when a product in the new order cannot be found in the previous version (non-local products)', () => {
    const order = makeOrder([{ quantity:1, productId: 1 }], [])
    const previousOrder = makeOrder([], [{ quantity: 2, productId: 2 }])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Not identical when a product in the new order has a different quantity than in the previous version', () => {
    const order = makeOrder([{ quantity:1, productId: 1 }], [])
    const previousOrder = makeOrder([{ quantity: 2, productId: 1 }], [])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Not identical when a product in the new order has a different quantity than in the previous version (non-local products)', () => {
    const order = makeOrder([], [{ quantity:1, productId: 1 }])
    const previousOrder = makeOrder([], [{ quantity: 2, productId: 1 }])
    expect(ordersIdentical(order, previousOrder)).toBeFalsy()
})
test('Identical when a all product in the new order have the same quantity in the previous version', () => {
    const order = makeOrder([], [{ quantity:1, productId: 1 }])
    const previousOrder = makeOrder([], [{ quantity: 1, productId: 1 }])
    expect(ordersIdentical(order, previousOrder)).toBeTruthy()
})
test('Identical when a all product in the new order have the same quantity in the previous version (non-local products)', () => {
    const order = makeOrder([], [{ quantity:1, productId: 1 }])
    const previousOrder = makeOrder([], [{ quantity: 1, productId: 1 }])
    expect(ordersIdentical(order, previousOrder)).toBeTruthy()
})