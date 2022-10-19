import React from 'react'

import { ComponentStory, ComponentMeta } from '@storybook/react'

import DeliveryPreferenceInput from '../components/deliveryPreferenceInput'
import { OrderData, DeliveryTimes, OrderStatus } from '../lib/common'

export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Delivery preferences input',
  component: DeliveryPreferenceInput,
} as ComponentMeta<typeof DeliveryPreferenceInput>


const order: OrderData = {
  slug: '',
  preferredDeliveryTimes: [
    {
      day: new Date(2022,10,25, 0,0,0),
      times: [{
        deliveryTime: DeliveryTimes.h8,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h9,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h10,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h11,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h12,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h13,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h14,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h15,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h16,
        checked: false
      }]
    }, {
      day: new Date(2022,10,26, 0,0,0),
      times: [{
        deliveryTime: DeliveryTimes.h14,
        checked: false
      },{
        deliveryTime: DeliveryTimes.h15,
        checked: false
      }]
    },
  ],
  note: '',
  status: OrderStatus.draft,
  quantities: [],
  quantitiesNonLocal: []
}

const getFieldProps = (name: string) => {
    return {
      /** Value of the field */
      value: {} as any,
      /** Name of the field */
      name ,
      /** Change event handler */
      onChange: () => {},
      /** Blur event handler */
      onBlur: () => {}
    }
}

export const Primary: ComponentStory<typeof DeliveryPreferenceInput> = () => 
  <DeliveryPreferenceInput 
    order={order} values={{}} errors={{}} touched={{}} getFieldProps={getFieldProps}></DeliveryPreferenceInput>;