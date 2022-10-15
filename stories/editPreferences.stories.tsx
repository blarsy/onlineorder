import React from 'react'

import { ComponentStory, ComponentMeta } from '@storybook/react'
import EditPreferences from '../pages/components/editPreferences'
import { CustomerData, DeliveryTimes, OrderData, OrderStatus } from '../lib/common'
import { EnrichedSalesCycle } from '../lib/salesCycleCache'


export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Edit preferences form',
  component: EditPreferences,
} as ComponentMeta<typeof EditPreferences>


const customer: CustomerData = {
    title: '',
    email:'',
    slug: '',
    mobileNumber:'',
    customerName:'',
    order: {
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
        quantities: []
    }
}

const Template : ComponentStory<typeof EditPreferences> = (args) => <EditPreferences {...args} />

export const ManyAvailableHours = Template.bind({})

ManyAvailableHours.args = {
    customer
}