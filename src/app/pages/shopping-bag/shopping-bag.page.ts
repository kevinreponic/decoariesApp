import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import {ProductModalPage} from '../../modals/product-modal/product-modal.page'
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopping-bag',
  templateUrl: './shopping-bag.page.html',
  styleUrls: ['./shopping-bag.page.scss'],
})
export class ShoppingBagPage implements OnInit {
  token : any;
  bagProducts :any[];
  totalItems : any;
  completedProducts = []
  constructor(private dbService : DatabaseService, 
    private router : Router,
    private alertController : AlertController, 
    private storage : Storage,
    private modalController : ModalController,
    private toastController : ToastController) { }

  ngOnInit() {
    this.totalItems = 0;
    this.storage.get('token').then(res=>{
      this.token = res
      this.dbService.getProductsInBag(this.token).subscribe(data=>{
        if(data){
          this.bagProducts = data['products']
          this.bagProducts.forEach(product=>{
            this.totalItems = this.totalItems+product.Quantity
          }) 
        }
        
      })
    })
  }

  changeTotal(){
    this.totalItems=0;
    this.bagProducts.forEach(product=>{
      this.totalItems = this.totalItems+product.Quantity
    }) 
  }

  async presentModal(product){
    let modal = await this.modalController.create({
      component : ProductModalPage,
      componentProps : {product : product}

    })

    return await modal.present();
  }

  async presentToast(message, duration){
    let toast = await this.toastController.create({
      message : message,
      duration : duration
    })

    return await toast.present()
  }

   async presentDeleteAlert(product){
    let alert = await this.alertController.create({
      header: 'Remove Product',
      message : 'Are you sure you want to remove this product from your shopping bag?',
      buttons : [
        {
          text : 'Yes',
          role : 'confirm',
          handler : () =>{
            this.dbService.deleteProductQuote(product, this.token).subscribe(data=>{
              console.log(product)
              if(data){
                this.dbService.productsInBag--
                this.presentToast(data['msg'], 3000)
                return this.ngOnInit()
              }
            })
          }
        },
        {
          text : 'No',
          role : 'cancel',
          handler : () =>{
          }
        }
      ]
    })

   await alert.present();
  }


  async presentConfirmAlert(){
    if(this.bagProducts.length==0){
      this.presentToast("You don't have any products in your shopping bag", 3000)
      return false;
    }
    let alert = await this.alertController.create({
      header : 'Confirm Quote Request',
      message : 'Do you want to submit a request for a quote of the items in your shopping bag?',
      buttons : [
        {
          text : 'Submit',
          role : 'confirm',
          handler : () =>{
            let body = {
              products : this.bagProducts,
              idQuote : this.bagProducts[0].idQuote
            }
            console.log(body)

            this.dbService.requestQuote(body, this.token).subscribe(data=>{
              if(data['success']){
                this.router.navigate(['home'])
                return this.presentSentAlert();
              }
            })
          }
        },
        {
          text : 'Cancel',
          role : 'cancel',
          handler : () =>{
          }
        }
      ]
    })
    await alert.present();
  }

  async presentSentAlert(){
    let alert = await this.alertController.create({
      header : 'Quote Requested',
      message : 'You will recieve an email within the following 5 days with the information you requested. Thanks for using the Decoaries App!',
      buttons : [{
        text : 'Ok',
        role : 'confirm'
      }]
    })
    await alert.present();
  }

}
